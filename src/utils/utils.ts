export const capitalizeFirstLetters = (str: string) => {
    return str?.toLowerCase()?.split(" ")?.map(word => word.charAt(0).toUpperCase() + word.slice(1))?.join(" ");
}

export const formatCardNumber = (raw: string) => {
  return raw
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export const formatExpiry = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

type CardNetwork = "visa" | "mastercard" | "verve" | null;

export const detectNetwork = (num: string): CardNetwork => {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(50|5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^(6[3-9]|650|5061)/.test(n)) return "verve";
  return null;
}