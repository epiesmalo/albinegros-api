const {
  withAndroidManifest,
  withBaseMod,
} = require('expo/config-plugins');

function withRecordAudioCleanup(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    manifest['uses-permission'] = manifest['uses-permission'] || [];

    const permissionName = 'android.permission.RECORD_AUDIO';
    const existing = manifest['uses-permission'].find(
      (item) => item?.$?.['android:name'] === permissionName
    );

    if (existing) {
      existing.$['tools:node'] = 'remove';
    } else {
      manifest['uses-permission'].push({
        $: {
          'android:name': permissionName,
          'tools:node': 'remove',
        },
      });
    }

    manifest.application = manifest.application || [{ $: {} }];
    const application = manifest.application[0];
    application.service = application.service || [];

    const recordingServiceName =
      'expo.modules.audio.service.AudioRecordingService';

    const existingRecordingService = application.service.find(
      (item) => item?.$?.['android:name'] === recordingServiceName
    );

    if (existingRecordingService) {
      existingRecordingService.$['tools:node'] = 'remove';
    } else {
      application.service.push({
        $: {
          'android:name': recordingServiceName,
          'tools:node': 'remove',
        },
      });
    }

    return config;
  });
}

function withFinalManifestCleanup(config) {
  return withBaseMod(config, {
    platform: 'android',
    mod: 'manifest',
    isProvider: false,
    async action({ modRequest: { nextMod, ...modRequest }, ...config }) {
      const results = await nextMod({
        ...config,
        modRequest,
      });

      const manifest = results.modResults.manifest;

      if (manifest?.application?.[0]?.$) {
        delete manifest.application[0].$[
          'android:requestLegacyExternalStorage'
        ];
      }

      return results;
    },
  });
}

module.exports = function withRemoveRecordAudio(config) {
  config = withRecordAudioCleanup(config);
  config = withFinalManifestCleanup(config);
  return config;
};
