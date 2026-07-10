export type AuthFormState = {
  error?: string;
  message?: string;
  email?: string;
  mode?: "email" | "login" | "signup";
  username?: string | null;
  fullName?: string | null;
};
