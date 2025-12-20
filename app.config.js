const path = require('path');

module.exports = ({ config }) => {
    // Use EAS secret file path if available, otherwise fallback to local file
    const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || './google-services.json';

    return {
        ...config,
        android: {
            ...config.android,
            googleServicesFile,
        },
    };
};
