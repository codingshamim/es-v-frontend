import { RegisterForm } from "./RegisterForm";

export const metadata = {
  title: "Register",
  description:
    "Create your ES FITT account – exclusive offers and order tracking.",
};

export default function RegisterPage() {
  return (
    <>
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 bg-black dark:bg-black">
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </main>
    </>
  );
}
