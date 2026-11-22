/** The dedicated local staff portal uses a separate development cache. */
export default {
  images: { unoptimized: true },
  distDir:
    process.env.PULSE_LOCAL_ADMIN_SERVER === "true" &&
    process.env.NODE_ENV === "development"
      ? ".next-admin"
      : ".next",
};
