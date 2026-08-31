"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/resources";
import { useMutation } from "@/lib/hooks";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/ui/Button";
import { Checkbox, TextInput } from "@/components/ui/Fields";
import Icon from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("sarin@weshort.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const login = useMutation(async () => {
    const res = await authApi.login(email, password);
    window.localStorage.setItem("weshort.admin.token", res.token);
    return res;
  });

  const emailError = touched && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid email" : undefined;
  const passwordError = touched && password.length < 4 ? "Password is too short" : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emailError || passwordError) return;
    const res = await login.run();
    if (res) {
      toast.success(`Welcome back, ${res.user.name}`);
      router.push("/users");
    }
  };

  return (
    <>
      <AuthShell
        eyebrow="Secure area"
        title="Sign in"
        subtitle="Manage the WeShort catalogue, projects and channels."
        footer={
          <>
            New to WeShort?{" "}
            <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
              Create an account
            </Link>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            placeholder="you@weshort.com"
            autoComplete="email"
          />
          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in" />
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setResetOpen(true);
              }}
              className="text-[13px] text-muted transition hover:text-ink"
            >
              Forgot password?
            </button>
          </div>

          {login.error ? (
            <p className="flex items-center gap-2 rounded-2xl bg-danger/12 px-4 py-3 text-sm text-danger">
              <Icon name="close" size={15} /> {login.error}
            </p>
          ) : null}

          <Button type="submit" size="lg" loading={login.pending} className="w-full">
            Sign in
          </Button>
        </form>
      </AuthShell>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset your password"
        description="We send a reset link to the address on your account."
        width="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!/^\S+@\S+\.\S+$/.test(resetEmail)}
              onClick={() => {
                setResetOpen(false);
                toast.success(`Reset link sent to ${resetEmail}`);
              }}
            >
              Send link
            </Button>
          </>
        }
      >
        <TextInput
          label="Email"
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="you@weshort.com"
        />
      </Modal>
    </>
  );
}
