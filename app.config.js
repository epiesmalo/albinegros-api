const appJson = require('./app.json');

const isDevelopment = process.env.APP_VARIANT === 'development';

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    name: isDevelopment
      ? 'Albinegros Castellón DEV'
      : appJson.expo.name,
    android: {
      ...appJson.expo.android,
      googleServicesFile: './google-services.json',
      package: isDevelopment
        ? 'com.albinegroscastellon.app.dev'
        : appJson.expo.android.package,
    },
  },
};


