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
import { useToast } from "@/components/ui/Toast";

/** Rough password strength, only to give the field a meter. */
function strengthOf(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#ff4d5e", "#ff4d5e", "#ffb020", "#2f6bff", "#3ddc84"];
  return { score, label: labels[score], color: colors[score] };
}

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState(false);

  const register = useMutation(async () => {
    const res = await authApi.register({ name, email, password, organisation });
    window.localStorage.setItem("weshort.admin.token", res.token);
    return res;
  });

  const strength = strengthOf(password);
  const nameError = touched && name.trim().length < 2 ? "Enter your full name" : undefined;
  const orgError = touched && organisation.trim().length < 2 ? "Enter your organisation" : undefined;
  const emailError = touched && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid email" : undefined;
  const passwordError = touched && password.length < 8 ? "Use at least 8 characters" : undefined;
  const confirmError = touched && confirm !== password ? "Passwords do not match" : undefined;
  const termsError = touched && !terms ? "Accept the terms to continue" : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || orgError || emailError || passwordError || confirmError || !terms) return;
    const res = await register.run();
    if (res) {
      toast.success(`Account created for ${res.user.name}`);
      router.push("/dashboard");
    }
  };

  return (
    <AuthShell
      eyebrow="Create an account"
      title="Get started"
      subtitle="Set up your organisation and start publishing in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label="Full name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
            placeholder="Sarin Kumar"
            autoComplete="name"
          />
          <TextInput
            label="Organisation"
            required
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            error={orgError}
            placeholder="WeShort Srl"
            autoComplete="organization"
          />
        </div>

        <TextInput
          label="Work email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          placeholder="you@weshort.com"
          autoComplete="email"
        />

        <div>
          <TextInput
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          {password ? (
            <div className="mt-2.5 flex items-center gap-3">
              <span className="flex flex-1 gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition"
                    style={{ background: i < strength.score ? strength.color : "var(--surface-3)" }}
                  />
                ))}
              </span>
              <span className="text-[12px] font-semibold" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          ) : null}
        </div>

        <TextInput
          label="Confirm password"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        <div>
          <Checkbox
            checked={terms}
            onChange={setTerms}
            label="I agree to the terms of service and the privacy policy"
          />
          {termsError ? <p className="mt-1.5 text-xs text-danger">{termsError}</p> : null}
        </div>

        {register.error ? (
          <p className="flex items-center gap-2 rounded-2xl bg-danger/12 px-4 py-3 text-sm text-danger">
            <Icon name="close" size={15} /> {register.error}
          </p>
        ) : null}

        <Button type="submit" size="lg" loading={register.pending} className="w-full">
          Create account
        </Button>

        <p className="flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] text-muted">
          <Icon name="shield" size={15} className="mt-0.5 shrink-0" />
          Your account starts on the Studio plan with 5 TB of bandwidth and 100 h of encoding.
        </p>
      </form>
    </AuthShell>
  );
}
