/** Brand logo (heart with couple + "Western UG Connect"). Light variant is for dark backgrounds. */
export function Logo({ light = false, stacked = false }: { light?: boolean; stacked?: boolean }) {
  if (stacked) {
    return (
      <img src="/img/logo-stacked-light.webp" width="176" height="132" alt="Western UG Connect"
        className="h-auto w-44" decoding="async" loading="lazy" />
    );
  }
  return (
    <img src={light ? "/img/logo-light.webp" : "/img/logo.webp"} width="447" height="96" alt="Western UG Connect"
      className="h-10 w-auto sm:h-12" decoding="async" />
  );
}
