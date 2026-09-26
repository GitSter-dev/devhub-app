const { withAppBuildGradle } = require("expo/config-plugins");

const DEBUG_SIGNING = /(signingConfigs \{\s*debug \{[^}]*\})/;
const RELEASE_USES_DEBUG = /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/;

const RELEASE_SIGNING = `
        release {
            if (findProperty('DEVHUB_RELEASE_STORE_FILE')) {
                storeFile file(findProperty('DEVHUB_RELEASE_STORE_FILE'))
                storePassword findProperty('DEVHUB_RELEASE_STORE_PASSWORD')
                keyAlias findProperty('DEVHUB_RELEASE_KEY_ALIAS')
                keyPassword findProperty('DEVHUB_RELEASE_KEY_PASSWORD')
            }
        }`;

const RELEASE_SIGNING_CHOICE =
  "signingConfig findProperty('DEVHUB_RELEASE_STORE_FILE') ? signingConfigs.release : signingConfigs.debug";

function addReleaseSigning(gradle) {
  if (gradle.includes("DEVHUB_RELEASE_STORE_FILE")) return gradle;
  if (!DEBUG_SIGNING.test(gradle) || !RELEASE_USES_DEBUG.test(gradle)) {
    throw new Error("with-release-signing: app/build.gradle no longer matches the expected Expo template");
  }
  return gradle.replace(DEBUG_SIGNING, `$1${RELEASE_SIGNING}`).replace(RELEASE_USES_DEBUG, `$1${RELEASE_SIGNING_CHOICE}`);
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = addReleaseSigning(mod.modResults.contents);
    return mod;
  });
};

module.exports.addReleaseSigning = addReleaseSigning;
