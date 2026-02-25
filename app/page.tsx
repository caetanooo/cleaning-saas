import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Link href="/cleaner/login" style={{ padding: "1rem 2rem", background: "#0ea5e9", color: "#fff", borderRadius: "12px", fontWeight: "bold", fontSize: "1.2rem", textDecoration: "none" }}>
        ENTRAR
      </Link>
    </div>
  );
}
