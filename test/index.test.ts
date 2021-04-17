import connect from "connect";
import request from "supertest";
import { IncomingMessage, ServerResponse } from "http";

import permissionsPolicy = require("..");

function app(middleware: ReturnType<typeof permissionsPolicy>): connect.Server {
  const result = connect();
  result.use(middleware);
  result.use((_req: IncomingMessage, res: ServerResponse) => {
    res.end("Hello world!");
  });
  return result;
}

describe("permissionsPolicy", () => {
  it("fails without at least 1 feature", () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect(permissionsPolicy.bind(null)).toThrow();
    expect(permissionsPolicy.bind(null, {} as any)).toThrow();
    expect(permissionsPolicy.bind(null, { features: null } as any)).toThrow();
    expect(permissionsPolicy.bind(null, { features: {} } as any)).toThrow();
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it("fails if a feature's value is not an array", () => {
    [
      "self",
      null,
      undefined,
      123,
      true,
      false,
      {
        length: 1,
        "0": "*",
      },
    ].forEach((value) => {
      expect(
        permissionsPolicy.bind(null, {
          features: { vibrate: value as any }, // eslint-disable-line @typescript-eslint/no-explicit-any
        })
      ).toThrow();
    });
  });

  it("fails if a feature's value is an array with a non-string", () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["example.com", null] as any },
      })
    ).toThrow();
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["example.com", 123] as any },
      })
    ).toThrow();
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: [new String("example.com")] as any }, // eslint-disable-line no-new-wrappers
      })
    ).toThrow();
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it('fails if "self" or if "none" are quoted', () => {
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["'self'"] },
      })
    ).toThrow();
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["'none'"] },
      })
    ).toThrow();
  });

  it('fails if a feature value contains "*" and additional values', () => {
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["*", "example.com"] },
      })
    ).toThrow();
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["example.com", "*"] },
      })
    ).toThrow();
  });

  it('fails if a feature value contains "none" and additional values', () => {
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["'none'", "example.com"] },
      })
    ).toThrow();
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["example.com", "'none'"] },
      })
    ).toThrow();
  });

  it("fails if a feature value contains duplicates", () => {
    expect(
      permissionsPolicy.bind(null, {
        features: { vibrate: ["example.com", "example.com"] },
      })
    ).toThrow();
  });

  it('can set "vibrate" to "*"', () => {
    return request(
      app(
        permissionsPolicy({
          features: { vibrate: ["*"] },
        })
      )
    )
      .get("/")
      .expect("Permissions-Policy", "vibrate=(*)")
      .expect("Hello world!");
  });

  it('can set "vibrate" to "self"', () => {
    return request(
      app(
        permissionsPolicy({
          features: { vibrate: ["self"] },
        })
      )
    )
      .get("/")
      .expect("Permissions-Policy", "vibrate=(self)")
      .expect("Hello world!");
  });

  it('can set "vibrate" to "none"', () => {
    return request(
      app(
        permissionsPolicy({
          features: { vibrate: ["none"] },
        })
      )
    )
      .get("/")
      .expect("Permissions-Policy", "vibrate=(none)")
      .expect("Hello world!");
  });

  it('can set "vibrate" as emtpy (disabled)', () => {
    return request(
      app(
        permissionsPolicy({
          features: { vibrate: [] },
        })
      )
    )
      .get("/")
      .expect("Permissions-Policy", "vibrate=()")
      .expect("Hello world!");
  });

  it('can set "vibrate" to contain domains', () => {
    return request(
      app(
        permissionsPolicy({
          features: { vibrate: ['"example.com"', '"evanhahn.com"'] },
        })
      )
    )
      .get("/")
      .expect("Permissions-Policy", 'vibrate=("example.com" "evanhahn.com")')
      .expect("Hello world!");
  });

  it("dashifies feature keys", async () => {
    await request(
      app(
        permissionsPolicy({
          features: { unoptimizedImages: ['"example.com"'] },
        })
      )
    )
      .get("/")
      .expect("Permissions-Policy", 'unoptimized-images=("example.com")')
      .expect("Hello world!");
  });

  it("can set multiple features", async () => {
    const response = await request(
      app(
        permissionsPolicy({
          features: {
            fullscreen: [],
            geolocation: ["self", '"https://example.com"'],
            vibrate: ["*"],
          },
        })
      )
    )
      .get("/")
      .expect("Hello world!");
    const headerValue = response.get("Permissions-Policy");

    const actualFeatures = new Set(headerValue.split(", "));

    expect(actualFeatures).toEqual(
      new Set([
        "fullscreen=()",
        'geolocation=(self "https://example.com")',
        "vibrate=(*)",
      ])
    );
  });

  it("names its function and middleware", () => {
    expect(permissionsPolicy.name).toBe("permissionsPolicy");
    expect(permissionsPolicy.name).toBe(
      permissionsPolicy({
        features: { vibrate: ["*"] },
      }).name
    );
  });
});
