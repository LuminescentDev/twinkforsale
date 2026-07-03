// Environment configuration - simplified approach for Qwik City
export const getEnvConfig = () => {
  return {
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    BASE_STORAGE_LIMIT: BigInt(process.env.BASE_STORAGE_LIMIT || '10737418240'), // 10GB
    BASE_URL: process.env.BASE_URL || 'https://twink.forsale',
    ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES ||
      'image/png,image/jpeg,image/gif,image/webp,text/plain,application/pdf'
    ).split(','),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
    
    // R2 Storage Configuration
    USE_R2_STORAGE: process.env.USE_R2_STORAGE === 'true',
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.r2.dev`
  };
};

// // For non-request contexts (like server startup)
// export const getEnvConfig = () => {
//   return {
//     UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
//     MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
//     BASE_STORAGE_LIMIT: parseInt(process.env.BASE_STORAGE_LIMIT || '10737418240'), // 10GB
//     BASE_URL: process.env.BASE_URL || 'https://twink.forsale',
//     ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES ||
//       'image/png,image/jpeg,image/gif,image/webp,text/plain,application/pdf'
//     ).split(','),
//     NODE_ENV: process.env.NODE_ENV || 'development'
//   };
// };
