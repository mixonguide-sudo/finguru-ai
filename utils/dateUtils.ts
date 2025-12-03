
export const toLocalISOString = (date: Date): string => {
  const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, -1);
  return localISOTime; // Returns YYYY-MM-DDTHH:mm:ss.sss (Local Time)
};
