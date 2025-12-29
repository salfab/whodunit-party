import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // For now, we only support French
  const locale = 'fr';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
