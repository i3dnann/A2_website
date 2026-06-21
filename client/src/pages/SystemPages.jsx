import { Link } from "react-router-dom";
import { AlertTriangle, Construction, Home } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

export function ForbiddenPage() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12">
      <Card className="text-center">
        <AlertTriangle className="mx-auto mb-4 text-a2-warning" size={40} />
        <h1 className="text-4xl font-black">403 No Permission</h1>
        <p className="mt-3 text-white/55">Your Discord roles do not have permission for this page. Admins can edit role permissions in the staff panel.</p>
        <Button as={Link} to="/" className="mt-6"><Home size={16} /> Back home</Button>
      </Card>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12">
      <Card className="text-center">
        <Construction className="mx-auto mb-4 text-a2-green" size={40} />
        <h1 className="text-4xl font-black">404</h1>
        <p className="mt-3 text-white/55">This city page does not exist or has been hidden.</p>
        <Button as={Link} to="/" className="mt-6"><Home size={16} /> Back home</Button>
      </Card>
    </main>
  );
}

export function MaintenancePage() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12">
      <Card className="text-center">
        <Construction className="mx-auto mb-4 text-a2-green" size={40} />
        <h1 className="text-4xl font-black">Maintenance</h1>
        <p className="mt-3 text-white/55">The website is in maintenance mode. Staff can disable this in settings.</p>
      </Card>
    </main>
  );
}
