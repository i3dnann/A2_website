import { useApp } from "../context/AppContext.jsx";
import { Card } from "../components/Card.jsx";

export function RulesPage() {
  const { settings } = useApp();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <p className="text-sm font-black uppercase tracking-wide text-a2-green">City rules</p>
        <h1 className="mt-2 text-4xl font-black">Rules</h1>
        <p className="mt-6 whitespace-pre-line leading-8 text-white/65">{settings.rulesText || "Rules can be edited from the staff settings panel."}</p>
      </Card>
    </main>
  );
}

export function TermsPage() {
  const { settings } = useApp();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <p className="text-sm font-black uppercase tracking-wide text-a2-green">Terms version {settings.termsVersion || "1.0.0"}</p>
        <h1 className="mt-2 text-4xl font-black">Terms & Conditions</h1>
        <p className="mt-6 whitespace-pre-line leading-8 text-white/65">{settings.termsText || "Terms can be edited from the staff settings panel."}</p>
      </Card>
    </main>
  );
}
