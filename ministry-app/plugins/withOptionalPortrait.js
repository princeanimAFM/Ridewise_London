// The app is locked to portrait (app.json "orientation"). Android then treats a portrait screen as a
// required hardware feature, and Google Play warns that this stops some devices (tablets, Chromebooks,
// XR) from installing the app. Declaring the feature as optional keeps the app upright on phones while
// letting every device install it.
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withOptionalPortrait(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const features = (manifest['uses-feature'] = manifest['uses-feature'] ?? []);
    for (const name of ['android.hardware.screen.portrait']) {
      const existing = features.find((f) => f.$['android:name'] === name);
      if (existing) existing.$['android:required'] = 'false';
      else features.push({ $: { 'android:name': name, 'android:required': 'false' } });
    }
    return cfg;
  });
};
