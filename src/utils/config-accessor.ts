import { config, AppConfig } from '@/config/app-config';

type Path<T> = T extends object
  ? { [K in keyof T]-?: K extends string ? `${K}` | `${K}.${Path<T[K]>}` : never }[keyof T]
  : never;

export const getConfig = () => config;

export const getConfigValue = <T = unknown>(path: Path<AppConfig>): T => {
  const parts = path.split('.');
  let current: any = config;
  for (const p of parts) {
    if (current && Object.prototype.hasOwnProperty.call(current, p)) {
      current = current[p];
    } else {
      throw new Error(`Missing configuration path: ${path}`);
    }
  }
  return current as T;
};

export const requireConfig = (paths: Array<Path<AppConfig>>): void => {
  const missing: string[] = [];
  for (const p of paths) {
    try {
      const v = getConfigValue<any>(p);
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
        missing.push(p);
      }
    } catch {
      missing.push(p);
    }
  }
  if (missing.length) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};
