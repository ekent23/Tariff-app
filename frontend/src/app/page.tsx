import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const highlights = [
  {
    title: "Tariff impact",
    value: "$4.2M",
    change: "+18.3%",
    description: "Projected annual duty exposure across all active lanes."
  },
  {
    title: "At-risk SKUs",
    value: "132",
    change: "27 high risk",
    description: "Products with concentrated supplier and HS-code risk."
  },
  {
    title: "Scenario coverage",
    value: "9",
    change: "What-if models",
    description: "Simulate rate shocks, country-of-origin shifts, and more."
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#000_80%)] px-4 py-10 text-zinc-50 sm:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 sm:gap-14">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/tradeshield-logo.png"
              alt="TradeShield"
              width={40}
              height={40}
              className="h-9 w-9"
              priority
            />
            <span className="text-sm font-medium text-zinc-300">
              TradeShield
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden text-sm sm:inline-flex">
              Product tour
            </Button>
            <Button variant="outline" size="sm" className="text-sm">
              Sign in
            </Button>
            <Button size="sm" className="text-sm">
              Request demo
            </Button>
          </div>
        </header>

        <section className="grid gap-12 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1.4fr)] lg:items-start">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/60 px-3 py-1 text-sm text-zinc-300 shadow-sm backdrop-blur">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Real-time tariff & supply chain risk intelligence
            </div>

            <div className="space-y-5">
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                Understand tariff exposure before it hits your P&L.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                TradeShield connects public tariff schedules with your internal
                supplier and SKU data to surface hidden cost, concentration, and
                compliance risks before they become urgent.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" className="px-7 text-base">
                Upload tariff & supplier data
              </Button>
              <Button variant="outline" size="lg" className="border-zinc-700/80 bg-transparent text-base text-zinc-100">
                Run a what-if scenario
              </Button>
              <p className="w-full text-base text-zinc-400 sm:w-auto">
                No agents needed: results in minutes, not months.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {highlights.map((item) => (
                <Card
                  key={item.title}
                  className="border-zinc-800/80 bg-zinc-900/70 text-zinc-50"
                >
                  <CardHeader className="mb-3 space-y-1">
                    <CardTitle className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-xl font-semibold sm:text-2xl">
                      {item.value}
                    </p>
                    <p className="text-base text-emerald-400">{item.change}</p>
                    <CardDescription className="text-base text-zinc-400">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-zinc-800/80 bg-zinc-950/70 text-zinc-50 shadow-xl shadow-emerald-500/10">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold text-zinc-100">
                Scenario: 15% tariff hike on key HS codes
                <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                  Draft
                </span>
              </CardTitle>
              <CardDescription className="text-base text-zinc-400">
                Blend public schedules, internal SKUs, and supplier exposure to
                understand where your landed cost is truly at risk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-zinc-900/80 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Projected duty delta
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-zinc-50">
                      +$1.3M
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Top impacted lanes
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      CN → US, MX → US
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 text-sm text-zinc-300 sm:grid-cols-3">
                  <div className="space-y-1 rounded-md bg-zinc-900/80 p-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      High risk SKUs
                    </p>
                    <p className="text-base font-medium">27</p>
                    <p className="text-[11px] text-zinc-500">
                      Single-source + high margin erosion.
                    </p>
                  </div>
                  <div className="space-y-1 rounded-md bg-zinc-900/80 p-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Supplier clusters
                    </p>
                    <p className="text-base font-medium">4</p>
                    <p className="text-[11px] text-zinc-500">
                      Overexposed to single country-of-origin.
                    </p>
                  </div>
                  <div className="space-y-1 rounded-md bg-zinc-900/80 p-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Compliance gaps
                    </p>
                    <p className="text-base font-medium">11</p>
                    <p className="text-[11px] text-zinc-500">
                      Missing or inconsistent HS assignments.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  AI risk summary
                </p>
                <p className="text-base leading-relaxed text-zinc-300">
                  “If implemented as drafted, this tariff change pushes landed
                  cost on your top 40 SKUs above target thresholds, with three
                  critical suppliers driving 58% of exposure. The fastest
                  mitigation path combines alternative HS reclassification for 9
                  SKUs with a staged shift of volume to secondary suppliers in
                  VN and MX.”
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-base text-zinc-400">
                <p>Built for trade, tax, and supply chain teams.</p>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Live connection to public schedules</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

