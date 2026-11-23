import { Layout } from "@/core/ui/Layout";
import { lazy, Suspense, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const Amortissements = lazy(() => import("@/modules/finance/Amortissements"));
const BusinessPlan = lazy(() => import("@/modules/finance/BusinessPlan"));
const BusinessPlanReel = lazy(() => import("@/modules/finance/BusinessPlanReel"));
const Comptabilite = lazy(() => import("@/modules/finance/Comptabilite"));
const BilanComptable = lazy(() => import("@/modules/finance/BilanComptable"));
const Emprunts = lazy(() => import("@/modules/finance/Emprunts"));
const FraisFixes = lazy(() => import("@/modules/finance/FraisFixes"));
const Marges = lazy(() => import("@/modules/finance/Marges"));
const Projections = lazy(() => import("@/modules/finance/Projections"));
const Rentabilite = lazy(() => import("@/modules/finance/Rentabilite"));
const AssociesGerants = lazy(() => import("@/modules/hr/AssociesGerants"));
const SalairesCotisations = lazy(() => import("@/modules/hr/SalairesCotisations"));
const Ingredients = lazy(() => import("@/modules/restaurant/Ingredients"));
const Dashboard = lazy(() => import("@/modules/restaurant/Dashboard"));
const Historique = lazy(() => import("@/modules/restaurant/Historique"));
const Journal = lazy(() => import("@/modules/restaurant/Journal"));
const Facturation = lazy(() => import("@/modules/restaurant/Facturation"));
const Operations = lazy(() => import("@/modules/restaurant/Operations"));
const Recettes = lazy(() => import("@/modules/restaurant/Recettes"));
const SimulateurCarte = lazy(() => import("@/modules/restaurant/SimulateurCarte"));
const Stock = lazy(() => import("@/modules/restaurant/Stock"));
const ParametresJuridiques = lazy(() => import("@/modules/settings/ParametresJuridiques"));

type Route =
  | "/"
  | "/dashboard"
  | "/historique"
  | "/journal"
  | "/facturation"
  | "/ingredients"
  | "/operations"
  | "/recettes"
  | "/simulateur"
  | "/stock"
  | "/salaries"
  | "/associes"
  | "/frais-fixes"
  | "/emprunts"
  | "/amortissements"
  | "/business-plan"
  | "/business-plan-reel"
  | "/comptabilite"
  | "/bilan-comptable"
  | "/rentabilite"
  | "/marges"
  | "/projections"
  | "/parametres";

const ROUTES: Record<Route, React.ComponentType> = {
  "/": Dashboard,
  "/dashboard": Dashboard,
  "/historique": Historique,
  "/journal": Journal,
  "/facturation": Facturation,
  "/ingredients": Ingredients,
  "/operations": Operations,
  "/recettes": Recettes,
  "/simulateur": SimulateurCarte,
  "/stock": Stock,
  "/salaries": SalairesCotisations,
  "/associes": AssociesGerants,
  "/frais-fixes": FraisFixes,
  "/emprunts": Emprunts,
  "/amortissements": Amortissements,
  "/business-plan": BusinessPlan,
  "/business-plan-reel": BusinessPlanReel,
  "/comptabilite": Comptabilite,
  "/bilan-comptable": BilanComptable,
  "/rentabilite": Rentabilite,
  "/marges": Marges,
  "/projections": Projections,
  "/parametres": ParametresJuridiques,
};

function getRouteFromHash(): Route {
  const hash = window.location.hash.replace("#", "") || "/";
  return (Object.keys(ROUTES).includes(hash) ? hash : "/") as Route;
}

function AppContent() {
  const queryClient = useQueryClient();
  const [route, setRoute] = useState<Route>(getRouteFromHash);

  useEffect(() => {
    const refresh = () => { void queryClient.invalidateQueries(); };
    window.addEventListener("storage", refresh);
    window.addEventListener("gestion-resto:data-changed", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("gestion-resto:data-changed", refresh); };
  }, [queryClient]);

  useEffect(() => {
    function onHashChange() {
      setRoute(getRouteFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const PageComponent = ROUTES[route];

  return (
    <Layout currentRoute={route}>
      <Suspense fallback={<div className="p-8 text-sm text-muted-foreground" role="status">Chargement de la page…</div>}>
        <PageComponent />
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
