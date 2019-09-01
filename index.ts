import { IncomingMessage, ServerResponse } from 'http';

interface FeaturePolicyOptions {
  features: {[featureName: string]: string[]};
}

function isPlainObject(value: unknown): value is {[key: string]: unknown} {
  return (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value !== null
  );
}

function getHeaderValueFromOptions(options: unknown): string {
  const FEATURES: {[featureKeyCamelCase: string]: string} = {
    accelerometer: 'accelerometer',
    ambientLightSensor: 'ambient-light-sensor',
    autoplay: 'autoplay',
    camera: 'camera',
    documentDomain: 'document-domain',
    documentWrite: 'document-write',
    encryptedMedia: 'encrypted-media',
    fontDisplayLateSwap: 'font-display-late-swap',
    fullscreen: 'fullscreen',
    geolocation: 'geolocation',
    gyroscope: 'gyroscope',
    layoutAnimations: 'layout-animations',
    legacyImageFormats: 'legacy-image-formats',
    loadingFrameDefaultEager: 'loading-frame-default-eager',
    magnetometer: 'magnetometer',
    microphone: 'microphone',
    midi: 'midi',
    notifications: 'notifications',
    oversizedImages: 'oversized-images',
    payment: 'payment',
    pictureInPicture: 'picture-in-picture',
    push: 'push',
    serial: 'serial',
    speaker: 'speaker',
    syncScript: 'sync-script',
    syncXhr: 'sync-xhr',
    unoptimizedImages: 'unoptimized-images',
    unoptimizedLosslessImages: 'unoptimized-lossless-images',
    unoptimizedLossyImages: 'unoptimized-lossy-images',
    unsizedMedia: 'unsized-media',
    usb: 'usb',
    verticalScroll: 'vertical-scroll',
    vibrate: 'vibrate',
    vr: 'vr',
    wakeLock: 'wake-lock',
    xr: 'xr',
  };

  if (!isPlainObject(options)) {
    throw new Error('featurePolicy must be called with an object argument. See the documentation.');
  }

  const { features } = options;
  if (!isPlainObject(features)) {
    throw new Error('featurePolicy must have a single key, "features", which is an object of features. See the documentation.');
  }

  const result = Object.keys(features).map((featureKeyCamelCase) => {
    if (!Object.prototype.hasOwnProperty.call(FEATURES, featureKeyCamelCase)) {
      throw new Error(`featurePolicy does not support the "${ featureKeyCamelCase }" feature.`);
    }

    const featureValue = features[featureKeyCamelCase];
    if (!Array.isArray(featureValue) || featureValue.length === 0) {
      throw new Error(`The value of the "${featureKeyCamelCase}" feature must be a non-empty array of strings.`);
    }

    const allowedValuesSeen: Set<string> = new Set();

    featureValue.forEach((allowedValue) => {
      if (typeof allowedValue !== 'string') {
        throw new Error(`The value of the "${featureKeyCamelCase}" feature contains a non-string, which is not supported.`);
      } else if (allowedValuesSeen.has(allowedValue)) {
        throw new Error(`The value of the "${featureKeyCamelCase}" feature contains duplicates, which it shouldn't.`);
      } else if (allowedValue === 'self') {
        throw new Error("'self' must be quoted.");
      } else if (allowedValue === 'none') {
        throw new Error("'none' must be quoted.");
      }
      allowedValuesSeen.add(allowedValue);
    });

    if (featureValue.length > 1) {
      if (allowedValuesSeen.has('*')) {
        throw new Error(`The value of the "${featureKeyCamelCase}" feature cannot contain * and other values.`);
      } else if (allowedValuesSeen.has("'none'")) {
        throw new Error(`The value of the "${featureKeyCamelCase}" feature cannot contain 'none' and other values.`);
      }
    }

    const featureKeyDashed = FEATURES[featureKeyCamelCase];
    return [featureKeyDashed, ...featureValue].join(' ');
  }).join(';');

  if (result.length === 0) {
    throw new Error('At least one feature is required.');
  }

  return result;
}

export = function featurePolicy (options: FeaturePolicyOptions) {
  const headerValue = getHeaderValueFromOptions(options);

  return function featurePolicy (_req: IncomingMessage, res: ServerResponse, next: () => void) {
    res.setHeader('Feature-Policy', headerValue);
    next();
  };
};
