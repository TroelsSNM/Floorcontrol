import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
} from "recharts";
import {
  Ticket,
  Users,
  Cloud,
  Leaf,
  Trees,
  Clock,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Sun,
  CloudRain,
  CloudSun,
  CalendarDays,
  CalendarCheck2,
  CalendarX2,
  Globe2,
  Loader2,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — stand-in for real feeds (POS/billetsystem, adgangstæller,
// DMI vejr-API, vagtplan). Structured so real endpoints can drop in later.
// ---------------------------------------------------------------------------

// Besøgstal gennem dagen — kombinerer tre kilder:
//  · forudbestilt: timeslot-billetter booket i Navipartner (kendt på forhånd)
//  · solgtIDøren: billetter solgt fysisk samme dag (Navipartner, salgskanal = dør)
//  · iHuset: faktisk antal mennesker i bygningen lige nu (tæller-app'en)
// De to første er "salg pr. time", den sidste er "aktuel belægning" —
// derfor bar for salg og linje for belægning i samme graf.
const hourlyVisitors = [
  { time: "09", forudbestilt: 28, solgtIDøren: 12, iHuset: 40 },
  { time: "10", forudbestilt: 95, solgtIDøren: 40, iHuset: 165 },
  { time: "11", forudbestilt: 180, solgtIDøren: 70, iHuset: 310 },
  { time: "12", forudbestilt: 260, solgtIDøren: 95, iHuset: 480 },
  { time: "13", forudbestilt: 310, solgtIDøren: 120, iHuset: 590 },
  { time: "14", forudbestilt: 300, solgtIDøren: 110, iHuset: 610 },
  { time: "15", forudbestilt: 210, solgtIDøren: 80, iHuset: 520 },
  { time: "16", forudbestilt: 120, solgtIDøren: 45, iHuset: 340 },
  { time: "17", forudbestilt: 30, solgtIDøren: 10, iHuset: 120 },
];

const ticketBreakdown = [
  { type: "Voksen", antal: 612 },
  { type: "Ung (18-27)", antal: 214 },
  { type: "Barn (3-17)", antal: 398 },
  { type: "Barn (0-2)", antal: 86 },
  { type: "Fribillet", antal: 64 },
  { type: "Andre", antal: 40 },
];

const stations = [
  { navn: "Hovedindgang", status: "Åben", kø: "4 min", bemanding: "3/3" },
  { navn: "Palmehuset", status: "Åben", kø: "0 min", bemanding: "1/1" },
  { navn: "Butik", status: "Åben", kø: "2 min", bemanding: "2/2" },
  { navn: "Café", status: "Reduceret", kø: "9 min", bemanding: "2/3" },
  { navn: "Skoleindgang", status: "Lukket", kø: "—", bemanding: "0/1" },
];

// Botanisk Have — separat tæller fra dem der sidder ved indgangen til haven,
// adskilt fra bygningens samlede besøgstal.
const gardenCounter = {
  nu: 214,
  trend: "+18 seneste time",
  op: true,
};

// Palmehuset — egen indgang og tæller, adskilt fra museets hovedbygning.
// Samme opbygning som hovedgrafen: forudbestilt + dørsalg (Navipartner) og
// faktisk antal i Palmehuset (tæller-app ved indgangen til drivhuset).
const palmehusHourly = [
  { time: "09", forudbestilt: 6, solgtIDøren: 3, iHuset: 9 },
  { time: "10", forudbestilt: 22, solgtIDøren: 10, iHuset: 34 },
  { time: "11", forudbestilt: 38, solgtIDøren: 16, iHuset: 58 },
  { time: "12", forudbestilt: 52, solgtIDøren: 20, iHuset: 71 },
  { time: "13", forudbestilt: 60, solgtIDøren: 24, iHuset: 82 },
  { time: "14", forudbestilt: 55, solgtIDøren: 22, iHuset: 76 },
  { time: "15", forudbestilt: 40, solgtIDøren: 15, iHuset: 55 },
  { time: "16", forudbestilt: 20, solgtIDøren: 8, iHuset: 28 },
  { time: "17", forudbestilt: 5, solgtIDøren: 2, iHuset: 10 },
];

const palmehusTicketBreakdown = [
  { type: "Voksen", antal: 142 },
  { type: "Ung (18-27)", antal: 48 },
  { type: "Barn (3-17)", antal: 86 },
  { type: "Barn (0-2)", antal: 20 },
  { type: "Fribillet", antal: 28 },
  { type: "Andre", antal: 16 },
];

// Forudsalg de kommende 7 dage — dagstotal fra Navipartner (kun forudbestilt/online).
const sevenDayTotals = [572, 672, 540, 398, 421, 705, 890];

// Forudsalg til i morgen — samme struktur som dagens salg, men typisk
// kun forudsolgte/online billetter, da dagsalget i døren jo ikke er sket endnu.
const tomorrowTicketBreakdown = [
  { type: "Voksen", antal: 244 },
  { type: "Ung (18-27)", antal: 88 },
  { type: "Barn (3-17)", antal: 168 },
  { type: "Barn (0-2)", antal: 36 },
  { type: "Fribillet", antal: 22 },
  { type: "Andre", antal: 14 },
];

const tomorrowBookedGroups = [
  { navn: "Skoleklasse 6.b, Taastrup Skole", tid: "09:30", antal: 24 },
  { navn: "Firmaudflugt, Nordea", tid: "11:00", antal: 40 },
  { navn: "Børnefødselsdag", tid: "13:00", antal: 12 },
];

// Palmehuset — forudsalg 7 dage frem, i morgen-detaljer og bookede grupper.
const palmehusSevenDayTotals = [148, 172, 130, 96, 108, 190, 234];

const palmehusTomorrowTicketBreakdown = [
  { type: "Voksen", antal: 68 },
  { type: "Ung (18-27)", antal: 22 },
  { type: "Barn (3-17)", antal: 40 },
  { type: "Barn (0-2)", antal: 12 },
  { type: "Fribillet", antal: 18 },
  { type: "Andre", antal: 12 },
];

const palmehusTomorrowBookedGroups = [
  { navn: "Botanikhold, KU", tid: "10:00", antal: 16 },
  { navn: "Haveklub Frederiksberg", tid: "13:30", antal: 22 },
];

// Fallback, hvis Nager Holidays API'et (se længere nede) ikke kan nås —
// bruges kun som sikkerhedsnet til "er det helligdag i dag"-tjekket.
// Når API'et svarer, bruges de live data for Danmark i stedet.
const FALLBACK_DK_HOLIDAYS_2026 = [
  { dato: "2026-01-01", navn: "Nytårsdag" },
  { dato: "2026-04-02", navn: "Skærtorsdag" },
  { dato: "2026-04-03", navn: "Langfredag" },
  { dato: "2026-04-05", navn: "Påskedag" },
  { dato: "2026-04-06", navn: "2. Påskedag" },
  { dato: "2026-05-14", navn: "Kristi Himmelfartsdag" },
  { dato: "2026-05-24", navn: "Pinsedag" },
  { dato: "2026-05-25", navn: "2. Pinsedag" },
  { dato: "2026-12-25", navn: "Juledag" },
  { dato: "2026-12-26", navn: "2. juledag" },
];

// Skoleferier — vejledende for Københavns Kommune 2026 (kan variere ±nogle dage pr. kommune).
// Nager Holidays dækker kun offentlige helligdage, ikke skoleferier, så denne forbliver manuel.
const danishSchoolHolidays2026 = [
  { navn: "Juleferie", start: "2025-12-24", slut: "2026-01-02" },
  { navn: "Vinterferie", start: "2026-02-09", slut: "2026-02-13" },
  { navn: "Påskeferie", start: "2026-03-30", slut: "2026-04-06" },
  { navn: "Sommerferie", start: "2026-06-29", slut: "2026-08-10" },
  { navn: "Efterårsferie", start: "2026-10-12", slut: "2026-10-16" },
  { navn: "Juleferie", start: "2026-12-21", slut: "2027-01-01" },
];

// Lande til den live helligdagsoversigt (Nager Holidays API) — samme lande som tidligere
// blev vist med vejledende sommerferieperioder. Danmark markeret til sammenligning.
const NAGER_COUNTRIES = [
  { code: "DK", navn: "Danmark", erDK: true },
  { code: "SE", navn: "Sverige" },
  { code: "DE", navn: "Tyskland" },
  { code: "NL", navn: "Holland" },
  { code: "NO", navn: "Norge" },
  { code: "FR", navn: "Frankrig" },
  { code: "IT", navn: "Italien" },
  { code: "ES", navn: "Spanien" },
  { code: "PT", navn: "Portugal" },
];

// Eventbookinger (iVvy) — udlejning af lokaler/venue til konferencer, receptioner,
// bryllupper m.m. Adskilt fra Navipartner, som kun dækker almindelige gæstebilletter.
const ivvyEvents = [
  { dato: "I dag", navn: "Reception, Danske Bank", lokale: "Vandrehallen", gæster: 80, status: "Bekræftet" },
  { dato: "27/8", navn: "Konference, Novo Nordisk", lokale: "Auditorium", gæster: 120, status: "Bekræftet" },
  { dato: "29/8", navn: "Bryllupsfest", lokale: "Palmehuset", gæster: 60, status: "Tentativ" },
  { dato: "31/8", navn: "Firmaevent, Ørsted", lokale: "Vandrehallen", gæster: 45, status: "Bekræftet" },
  { dato: "1/9", navn: "Rundvisning + frokost, pensionistforening", lokale: "Mødelokale 2", gæster: 15, status: "Tentativ" },
];

// Offentlige arrangementer (snm.dk/alle-arrangementer) — rundvisninger, foredrag,
// familieaktiviteter m.m. der er åbne for almindelige besøgende. Adskilt fra iVvy,
// som kun dækker private lokaleudlejninger.
// OBS: snm.dk blokerer automatiseret hentning (robots.txt) — kunne ikke hentes direkte.
// Eksempeldata herunder; kobl evt. på en RSS-feed eller CMS-API fra hjemmesiden i stedet.
const publicEvents = [
  { dato: "I dag", tid: "11:00–15:00", navn: "Værkstedet: Undersøg mineraler", sted: "Museet", målgruppe: "Familie" },
  { dato: "26/8", tid: "17:00–18:30", navn: "Vin & Videnskab", sted: "Museet", målgruppe: "Voksne" },
  { dato: "27/8", tid: "10:00–11:00", navn: "Rundvisning i Palmehuset", sted: "Palmehuset", målgruppe: "Alle" },
  { dato: "29/8", tid: "13:00–16:00", navn: "Insektjagt i Botanisk Have", sted: "Botanisk Have", målgruppe: "Børn" },
  { dato: "1/9", tid: "16:00–17:00", navn: "Foredrag: Biodiversitetskrisen", sted: "Auditorium", målgruppe: "Voksne" },
];

// ---------------------------------------------------------------------------

function SpecimenTag({ eyebrow, children }) {
  return (
    <div className="specimen-tag">
      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />
      <div className="eyebrow">{eyebrow}</div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  // ---------------------------------------------------------------------
  // DMI Forecast Data EDR API — HARMONIE DINI model, position query.
  // https://opendataapi.dmi.dk/v1/forecastedr/collections/harmonie_dini_sf/position
  // Koordinat: Statens Naturhistoriske Museum / Botanisk Have, København.
  // Ingen API-nøgle nødvendig.
  // ---------------------------------------------------------------------
  const DMI_COORDS = { lon: 12.5776, lat: 55.6867 };
  const DMI_PARAMS = "temperature-2m,total-precipitation,wind-speed-10m,fraction-of-cloud-cover";

  const [dmiFeatures, setDmiFeatures] = useState(null);
  const [dmiLoading, setDmiLoading] = useState(true);
  const [dmiError, setDmiError] = useState(null);

  const fetchDmiForecast = React.useCallback(async () => {
    setDmiLoading(true);
    setDmiError(null);
    try {
      const url = `https://opendataapi.dmi.dk/v1/forecastedr/collections/harmonie_dini_sf/position?coords=POINT(${DMI_COORDS.lon} ${DMI_COORDS.lat})&crs=crs84&parameter-name=${DMI_PARAMS}&f=GeoJSON`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDmiFeatures(data.features || []);
    } catch (err) {
      setDmiError(err.message || "Kunne ikke hente DMI-prognose");
    } finally {
      setDmiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDmiForecast();
  }, [fetchDmiForecast]);

  // ---------------------------------------------------------------------
  // Nager Holidays API — offentlige helligdage for udvalgte europæiske lande.
  // https://nagerholidays.com/api/v4/Holidays/{landekode}/{år}
  // Ingen API-nøgle nødvendig, CORS-aktiveret. Henter indeværende og næste
  // år for hvert land, så der altid er en kommende helligdag at vise —
  // også omkring årsskiftet.
  // ---------------------------------------------------------------------
  const [nagerHolidays, setNagerHolidays] = useState(null); // { DK: [...], SE: [...], ... }
  const [nagerLoading, setNagerLoading] = useState(true);
  const [nagerError, setNagerError] = useState(null);

  const fetchNagerHolidays = React.useCallback(async () => {
    setNagerLoading(true);
    setNagerError(null);
    try {
      const thisYear = new Date().getFullYear();
      const years = [thisYear, thisYear + 1];
      const results = await Promise.all(
        NAGER_COUNTRIES.map(async (c) => {
          const yearly = await Promise.all(
            years.map(async (year) => {
              const res = await fetch(`https://nagerholidays.com/api/v4/Holidays/${c.code}/${year}`);
              if (!res.ok) throw new Error(`${c.code} ${year}: HTTP ${res.status}`);
              return res.json();
            })
          );
          return [c.code, yearly.flat()];
        })
      );
      setNagerHolidays(Object.fromEntries(results));
    } catch (err) {
      setNagerError(err.message || "Kunne ikke hente helligdage");
    } finally {
      setNagerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNagerHolidays();
  }, [fetchNagerHolidays]);

  // Finder næste kommende offentlige helligdag for et land ud fra live-data.
  function nextNagerHoliday(countryCode) {
    if (!nagerHolidays || !nagerHolidays[countryCode]) return null;
    const todayIso = now.toISOString().slice(0, 10);
    const upcoming = nagerHolidays[countryCode]
      .filter((h) => h.date >= todayIso)
      .sort((a, b) => (a.date > b.date ? 1 : -1));
    return upcoming[0] || null;
  }

  function dmiIcon(summary) {
    if (!summary) return Cloud;
    if (summary.totalPrecip > 0.5) return CloudRain;
    if (summary.avgCloud > 0.6) return CloudSun;
    return Sun;
  }

  function dmiDetail(summary) {
    if (!summary) return "Ingen data";
    const nedbør =
      summary.totalPrecip > 0.5
        ? `Nedbør i alt ~${summary.totalPrecip.toFixed(1)} mm`
        : "Ingen nedbør i sigte";
    return `${nedbør} · vind ${summary.maxWind} m/s`;
  }

  // Samler DMI's timestep-features til ét dagsoverblik: middagstemperatur,
  // maks. vindstyrke, samlet nedbør og gennemsnitlig skydække for dagen.
  function summariseDmiDay(dayOffset) {
    if (!dmiFeatures || dmiFeatures.length === 0) return null;
    const target = new Date();
    target.setDate(target.getDate() + dayOffset);
    const targetDateStr = target.toDateString();

    const dayFeatures = dmiFeatures.filter(
      (f) => new Date(f.properties.step).toDateString() === targetDateStr
    );
    if (dayFeatures.length === 0) return null;

    const noonFeature =
      dayFeatures.find((f) => new Date(f.properties.step).getHours() === 12) ||
      dayFeatures[Math.floor(dayFeatures.length / 2)];

    const totalPrecip = dayFeatures.reduce(
      (sum, f) => sum + (f.properties["total-precipitation"] || 0),
      0
    );
    const avgCloud =
      dayFeatures.reduce((sum, f) => sum + (f.properties["fraction-of-cloud-cover"] || 0), 0) /
      dayFeatures.length;
    const maxWind = Math.max(
      ...dayFeatures.map((f) => f.properties["wind-speed-10m"] || 0)
    );

    return {
      tempC: Math.round(noonFeature.properties["temperature-2m"] - 273.15),
      totalPrecip,
      avgCloud,
      maxWind: Math.round(maxWind),
    };
  }

  const dateStr = now.toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = now.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sevenDayData = useMemo(() => {
    return sevenDayTotals.map((antal, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i + 1);
      const label = d.toLocaleDateString("da-DK", { weekday: "short" });
      return { dag: i === 0 ? "I morgen" : label.replace(".", ""), antal };
    });
  }, [now]);

  const palmehusSevenDayData = useMemo(() => {
    return palmehusSevenDayTotals.map((antal, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i + 1);
      const label = d.toLocaleDateString("da-DK", { weekday: "short" });
      return { dag: i === 0 ? "I morgen" : label.replace(".", ""), antal };
    });
  }, [now]);

  const holidayStatus = useMemo(() => {
    const iso = now.toISOString().slice(0, 10);

    // Brug live DK-helligdage fra Nager, når de er hentet — ellers fallback-listen.
    const dkHolidays =
      nagerHolidays && nagerHolidays.DK
        ? nagerHolidays.DK.map((h) => ({ dato: h.date, navn: h.localName || h.name }))
        : FALLBACK_DK_HOLIDAYS_2026;

    const publicHoliday = dkHolidays.find((h) => h.dato === iso);
    const schoolHoliday = danishSchoolHolidays2026.find(
      (h) => iso >= h.start && iso <= h.slut
    );

    if (publicHoliday || schoolHoliday) {
      return {
        erFerie: true,
        label: publicHoliday ? publicHoliday.navn : schoolHoliday.navn,
        type: publicHoliday ? "Officiel helligdag" : "Skoleferie",
      };
    }

    // Find næste kommende helligdag/ferie for kontekst.
    const kommende = [
      ...dkHolidays.map((h) => ({ ...h, dato: h.dato, type: "helligdag" })),
      ...danishSchoolHolidays2026.map((h) => ({ ...h, dato: h.start, type: "skoleferie" })),
    ]
      .filter((h) => h.dato > iso)
      .sort((a, b) => (a.dato > b.dato ? 1 : -1))[0];

    return {
      erFerie: false,
      næste: kommende ? kommende.navn : null,
      næsteDato: kommende
        ? new Date(kommende.dato).toLocaleDateString("da-DK", { day: "numeric", month: "short" })
        : null,
    };
  }, [now, nagerHolidays]);

  return (
    <div className="wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
          --ink: #1c2a1f;
          --paper: #f3efe3;
          --paper-dim: #ece5d3;
          --moss: #3c5a44;
          --moss-deep: #2a4234;
          --amber: #b9832f;
          --clay: #a85d3b;
          --slate: #5b6b66;
          --line: rgba(28,42,31,0.14);
          --radius: 2px;
        }

        * { box-sizing: border-box; }

        .wrap {
          min-height: 100vh;
          background: var(--paper);
          background-image:
            radial-gradient(circle at 1px 1px, rgba(28,42,31,0.055) 1px, transparent 0);
          background-size: 22px 22px;
          color: var(--ink);
          font-family: 'IBM Plex Sans', sans-serif;
          padding: 28px 20px 60px;
        }

        @media (min-width: 900px) {
          .wrap { padding: 40px 56px 70px; }
        }

        .masthead {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          border-bottom: 2px solid var(--ink);
          padding-bottom: 18px;
          margin-bottom: 28px;
        }

        .masthead-titlewrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .masthead-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: clamp(28px, 4vw, 42px);
          letter-spacing: -0.01em;
          line-height: 1;
        }

        .masthead-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--moss);
        }

        .masthead-right {
          text-align: right;
          font-family: 'IBM Plex Mono', monospace;
        }

        .masthead-date {
          font-size: 14px;
          text-transform: capitalize;
        }

        .masthead-time {
          font-size: 28px;
          font-weight: 500;
          color: var(--moss-deep);
        }

        .demo-banner {
          background: var(--ink);
          color: var(--paper);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.05em;
          padding: 9px 14px;
          margin-bottom: 24px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .demo-banner .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--amber);
          flex-shrink: 0;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 22px;
        }
        @media (max-width: 800px) {
          .hero-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .specimen-tag {
          position: relative;
          background: #fffdf7;
          border: 1px solid var(--line);
          padding: 16px 16px 14px;
        }
        .corner {
          position: absolute;
          width: 7px; height: 7px;
          border: 1.5px solid var(--moss);
        }
        .corner.tl { top: -1.5px; left: -1.5px; border-right: none; border-bottom: none; }
        .corner.tr { top: -1.5px; right: -1.5px; border-left: none; border-bottom: none; }
        .corner.bl { bottom: -1.5px; left: -1.5px; border-right: none; border-top: none; }
        .corner.br { bottom: -1.5px; right: -1.5px; border-left: none; border-top: none; }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--slate);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }

        .hero-value {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 34px;
          line-height: 1;
          color: var(--ink);
        }
        .hero-value small {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--slate);
          margin-left: 4px;
        }

        .hero-delta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          margin-top: 8px;
        }
        .up { color: var(--moss-deep); }
        .down { color: var(--clay); }

        .main-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr; }
        }

        .panel-title {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .panel-note {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--slate);
          margin-bottom: 14px;
        }

        table.stations {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        table.stations th {
          text-align: left;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--slate);
          font-weight: 500;
          padding: 6px 8px;
          border-bottom: 1px solid var(--ink);
        }
        table.stations td {
          padding: 9px 8px;
          border-bottom: 1px solid var(--line);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
        }
        .status-pill::before {
          content: '';
          width: 6px; height: 6px; border-radius: 50%;
        }
        .status-open::before { background: var(--moss); }
        .status-reduced::before { background: var(--amber); }
        .status-closed::before { background: var(--clay); }

        .lower-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 900px) {
          .lower-grid { grid-template-columns: 1fr; }
        }

        .spaces-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 14px;
        }
        @media (max-width: 700px) {
          .spaces-grid { grid-template-columns: 1fr; }
        }

        .section-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 34px 0 14px;
        }
        .section-divider.sub {
          margin: 22px 0 12px;
        }
        .section-divider.sub .label {
          font-size: 10px;
          opacity: 0.85;
        }
        .section-divider .line {
          flex: 1;
          height: 1px;
          background: var(--line);
        }
        .section-divider .label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--slate);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .holiday-tag {
          border-left: 3px solid var(--moss);
        }
        .holiday-tag.is-ferie {
          border-left: 3px solid var(--clay);
        }
        .holiday-status {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 22px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .europe-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .europe-list li {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--line);
          font-size: 13px;
        }
        .europe-list li:last-child { border-bottom: none; }
        .europe-list li.is-dk {
          font-weight: 600;
        }
        .europe-land {
          color: var(--ink);
          white-space: nowrap;
        }
        .europe-periode {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--slate);
          text-align: right;
        }
        .europe-list li.is-dk .europe-periode {
          color: var(--clay);
        }

        .tomorrow-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 700px) {
          .tomorrow-grid { grid-template-columns: 1fr; }
        }

        .booked-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .booked-list li {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid var(--line);
          font-size: 13px;
        }
        .booked-list li:last-child { border-bottom: none; }
        .booked-name { color: var(--ink); }
        .booked-meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--slate);
          white-space: nowrap;
        }

        .type-breakdown {
          list-style: none;
          margin: 12px 0 0;
          padding: 10px 0 0;
          border-top: 1px dashed var(--line);
        }
        .type-breakdown li {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 3px 0;
        }
        .type-breakdown .t-type { color: var(--ink); }
        .type-breakdown .t-antal {
          font-family: 'IBM Plex Mono', monospace;
          color: var(--slate);
        }

        .weather-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .weather-temp {
          font-family: 'Fraunces', serif;
          font-size: 30px;
          font-weight: 600;
        }
        .weather-detail {
          font-size: 13px;
          color: var(--slate);
          line-height: 1.4;
        }

        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .garden-note {
          font-size: 13px;
          color: var(--ink);
          line-height: 1.5;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed var(--line);
        }

        .table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin: 0 -4px;
          padding: 0 4px;
        }
        .table-scroll table { min-width: 480px; }

        /* Mobile tightening — phone-width screens */
        @media (max-width: 520px) {
          .wrap { padding: 18px 14px 44px; }
          .masthead { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 20px; }
          .masthead-right { text-align: left; }
          .masthead-time { font-size: 22px; }
          .demo-banner, .privacy-banner { font-size: 10.5px; padding: 8px 10px; }
          .hero-grid { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .hero-value { font-size: 26px; }
          .specimen-tag { padding: 13px 13px 11px; }
          .panel-title { font-size: 16px; }
          .section-divider { margin: 24px 0 12px; }
          table.stations th, table.stations td,
          table.data-table th, table.data-table td {
            padding: 7px 6px;
            font-size: 12px;
          }
        }

        footer {
          margin-top: 30px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          color: var(--slate);
          text-align: center;
        }
      `}</style>

      <div className="masthead">
        <div className="masthead-titlewrap">
          <div className="masthead-title">Statens Naturhistoriske Museum</div>
          <div className="masthead-sub">Driftsoverblik for Haven, Museet og Palmehuset</div>
        </div>
        <div className="masthead-right">
          <div className="masthead-date">{dateStr}</div>
          <div className="masthead-time">{timeStr}</div>
        </div>
      </div>

      <div className="demo-banner">
        <span className="dot" />
        EKSEMPELDATA — dette er et design-mockup. Ingen af tallene er hentet fra rigtige systemer endnu.
      </div>

      {/* Hero row */}
      <div className="hero-grid">
        <SpecimenTag eyebrow={<><Ticket size={12} /> Billetsalg i dag</>}>
          <div className="hero-value">1.842<small>stk.</small></div>
          <div className="hero-delta up"><TrendingUp size={13} /> +12% vs. sidste torsdag</div>
        </SpecimenTag>

        <SpecimenTag eyebrow={<><Users size={12} /> Gæster i huset nu</>}>
          <div className="hero-value">1.203</div>
          <div className="hero-delta up"><TrendingUp size={13} /> Forventet i alt: 2.400</div>
        </SpecimenTag>

        <SpecimenTag eyebrow={<><Clock size={12} /> Kø ved hovedindgang</>}>
          <div className="hero-value">4<small>min</small></div>
          <div className="hero-delta down"><TrendingDown size={13} /> −2 min siden kl. 13</div>
        </SpecimenTag>

        <SpecimenTag eyebrow={<><UserCheck size={12} /> Bemanding</>}>
          <div className="hero-value">8<small>/ 10 vagter</small></div>
          <div className="hero-delta down"><TrendingDown size={13} /> 2 sygemeldte i dag</div>
        </SpecimenTag>
      </div>

      {/* Holiday status */}
      <div className="section-divider">
        <span className="label"><CalendarDays size={13} /> Kalenderstatus</span>
        <span className="line" />
      </div>

      <div className={"specimen-tag holiday-tag" + (holidayStatus.erFerie ? " is-ferie" : "")} style={{ marginBottom: 14, maxWidth: 360 }}>
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
        <div className="eyebrow">
          {holidayStatus.erFerie ? <CalendarX2 size={12} /> : <CalendarCheck2 size={12} />} I dag i DK
        </div>
        {holidayStatus.erFerie ? (
          <>
            <div className="holiday-status">{holidayStatus.label}</div>
            <div className="garden-note">{holidayStatus.type} — forvent flere familier og evt. skoleklasser i indland.</div>
          </>
        ) : (
          <>
            <div className="holiday-status">Almindelig hverdag</div>
            <div className="garden-note">
              {holidayStatus.næste
                ? `Næste: ${holidayStatus.næste} (${holidayStatus.næsteDato})`
                : "Ingen kommende helligdag/ferie fundet i kalenderen."}
            </div>
          </>
        )}
      </div>

      {/* Visitor flow */}
      <div className="section-divider">
        <span className="label"><Users size={13} /> Museet</span>
        <span className="line" />
      </div>

      <div className="specimen-tag" style={{ marginBottom: 14 }}>
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
        <div className="panel-title">Besøgende gennem dagen</div>
        <div className="panel-note">
          Forudbestilt (Navipartner) · Dørsalg (Navipartner) · Faktisk i huset (tæller-app)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={hourlyVisitors} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(28,42,31,0.10)" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#5b6b66" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                fontFamily: "IBM Plex Mono",
                fontSize: 12,
                border: "1px solid #1c2a1f",
                borderRadius: 0,
              }}
            />
            <Legend
              wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, paddingTop: 6 }}
              formatter={(value) =>
                value === "forudbestilt" ? "Forudbestilt" : value === "solgtIDøren" ? "Solgt i døren" : "I huset nu"
              }
            />
            <Bar dataKey="forudbestilt" stackId="salg" fill="#3c5a44" radius={[0, 0, 0, 0]} />
            <Bar dataKey="solgtIDøren" stackId="salg" fill="#b9832f" radius={[1, 1, 0, 0]} />
            <Line
              type="monotone"
              dataKey="iHuset"
              stroke="#a85d3b"
              strokeWidth={2.25}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="garden-note">
          Forudsætter at Navipartner udstiller salgskanal (online/dør) og tidsslot pr. billet — tjek med jeres Navipartner-kontakt at felterne findes i jeres opsætning.
        </div>
      </div>

      {/* Lower grid: tickets breakdown + weather today/tomorrow */}
      <div className="lower-grid">
        <div className="specimen-tag">
          <span className="corner tl" /><span className="corner tr" />
          <span className="corner bl" /><span className="corner br" />
          <div className="panel-title">Billettyper</div>
          <div className="panel-note">Fordeling i dag · Museet</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={ticketBreakdown} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(28,42,31,0.10)" />
              <XAxis
                dataKey="type"
                tickLine={false}
                axisLine={false}
                tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#5b6b66" }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  fontFamily: "IBM Plex Mono",
                  fontSize: 12,
                  border: "1px solid #1c2a1f",
                  borderRadius: 0,
                }}
              />
              <Bar dataKey="antal" fill="#b9832f" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {(() => {
          const todaySummary = summariseDmiDay(0);
          const TodayIcon = dmiIcon(todaySummary);
          return (
            <SpecimenTag
              eyebrow={
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Cloud size={12} /> Vejr i dag</span>
                  <button
                    onClick={fetchDmiForecast}
                    disabled={dmiLoading}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
                      background: "transparent", border: "1px solid var(--line)",
                      padding: "2px 6px", cursor: dmiLoading ? "default" : "pointer",
                      opacity: dmiLoading ? 0.6 : 1, color: "var(--moss)",
                    }}
                  >
                    {dmiLoading ? <Loader2 size={10} className="spin" /> : <RefreshCw size={10} />}
                  </button>
                </span>
              }
            >
              {todaySummary ? (
                <div className="weather-row">
                  <TodayIcon size={30} color={TodayIcon === Sun ? "#b9832f" : "#5b6b66"} />
                  <div>
                    <div className="weather-temp">{todaySummary.tempC}°</div>
                    <div className="weather-detail">{dmiDetail(todaySummary)}</div>
                  </div>
                </div>
              ) : (
                <div className="weather-detail">{dmiLoading ? "Henter DMI-prognose…" : "Ingen data"}</div>
              )}
              <div className="garden-note">
                {dmiError
                  ? `Kunne ikke hente vejrdata (${dmiError}).`
                  : "Live fra DMI Forecast Data EDR API (HARMONIE), middagsværdi for i dag."}
              </div>
            </SpecimenTag>
          );
        })()}

        {(() => {
          const tomorrowSummary = summariseDmiDay(1);
          const TomorrowIcon = dmiIcon(tomorrowSummary);
          return (
            <SpecimenTag eyebrow={<><Cloud size={12} /> Vejr i morgen</>}>
              {tomorrowSummary ? (
                <div className="weather-row">
                  <TomorrowIcon size={30} color={TomorrowIcon === Sun ? "#b9832f" : "#5b6b66"} />
                  <div>
                    <div className="weather-temp">{tomorrowSummary.tempC}°</div>
                    <div className="weather-detail">{dmiDetail(tomorrowSummary)}</div>
                  </div>
                </div>
              ) : (
                <div className="weather-detail">{dmiLoading ? "Henter DMI-prognose…" : "Prognosen dækker endnu ikke i morgen"}</div>
              )}
              <div className="garden-note">
                {dmiError
                  ? `Kunne ikke hente vejrdata (${dmiError}).`
                  : "HARMONIE-modellen dækker typisk ~60 timer frem — bør altid være tilgængelig for i morgen."}
              </div>
            </SpecimenTag>
          );
        })()}
      </div>

      {/* Spaces grid: Palmehuset + Botanisk Have counters */}
      <div className="spaces-grid">
        <SpecimenTag eyebrow={<><Leaf size={12} /> Palmehuset</>}>
          <div className="hero-value">340<small>gæster igennem i dag</small></div>
          <div className="garden-note">
            Indendørs temp. 24° · luftfugtighed 68%. Ingen igangværende arrangementer.
          </div>
        </SpecimenTag>

        <SpecimenTag eyebrow={<><Trees size={12} /> Botanisk Have</>}>
          <div className="hero-value">{gardenCounter.nu}<small>i haven nu</small></div>
          <div className={"hero-delta " + (gardenCounter.op ? "up" : "down")}>
            {gardenCounter.op ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {gardenCounter.trend}
          </div>
          <div className="garden-note">
            Separat tæller fra havens egen indgang — tælles ikke med i "Gæster i huset nu".
          </div>
        </SpecimenTag>
      </div>

      {/* Palmehuset section: own visitor flow + ticket types */}
      <div className="section-divider">
        <span className="label"><Leaf size={13} /> Palmehuset</span>
        <span className="line" />
      </div>

      <div className="main-grid">
        <div className="specimen-tag">
          <span className="corner tl" /><span className="corner tr" />
          <span className="corner bl" /><span className="corner br" />
          <div className="panel-title">Besøgende gennem dagen</div>
          <div className="panel-note">
            Forudbestilt (Navipartner) · Dørsalg (Navipartner) · Faktisk i Palmehuset (tæller-app)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={palmehusHourly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(28,42,31,0.10)" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#5b6b66" }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  fontFamily: "IBM Plex Mono",
                  fontSize: 12,
                  border: "1px solid #1c2a1f",
                  borderRadius: 0,
                }}
              />
              <Legend
                wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, paddingTop: 6 }}
                formatter={(value) =>
                  value === "forudbestilt" ? "Forudbestilt" : value === "solgtIDøren" ? "Solgt i døren" : "I Palmehuset nu"
                }
              />
              <Bar dataKey="forudbestilt" stackId="salg" fill="#3c5a44" radius={[0, 0, 0, 0]} />
              <Bar dataKey="solgtIDøren" stackId="salg" fill="#b9832f" radius={[1, 1, 0, 0]} />
              <Line
                type="monotone"
                dataKey="iHuset"
                stroke="#a85d3b"
                strokeWidth={2.25}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="specimen-tag">
          <span className="corner tl" /><span className="corner tr" />
          <span className="corner bl" /><span className="corner br" />
          <div className="panel-title">Billettyper</div>
          <div className="panel-note">Fordeling i dag · Palmehuset</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={palmehusTicketBreakdown} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(28,42,31,0.10)" />
              <XAxis
                dataKey="type"
                tickLine={false}
                axisLine={false}
                tick={{ fontFamily: "IBM Plex Mono", fontSize: 9.5, fill: "#5b6b66" }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  fontFamily: "IBM Plex Mono",
                  fontSize: 12,
                  border: "1px solid #1c2a1f",
                  borderRadius: 0,
                }}
              />
              <Bar dataKey="antal" fill="#b9832f" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* iVvy event bookings */}
      <div className="section-divider">
        <span className="label"><CalendarDays size={13} /> Eventbookinger (iVvy)</span>
        <span className="line" />
      </div>

      <div className="specimen-tag" style={{ marginBottom: 14 }}>
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
        <div className="panel-title">Kommende venue-events</div>
        <div className="panel-note">Konferencer, receptioner, bryllupper m.m. — adskilt fra almindelige gæstebilletter</div>
        <div className="table-scroll">
        <table className="stations">
          <thead>
            <tr>
              <th>Dato</th>
              <th>Event</th>
              <th>Lokale</th>
              <th>Gæster</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ivvyEvents.map((e) => (
              <tr key={e.navn + e.dato}>
                <td>{e.dato}</td>
                <td>{e.navn}</td>
                <td>{e.lokale}</td>
                <td>{e.gæster}</td>
                <td>
                  <span
                    className={
                      "status-pill " +
                      (e.status === "Bekræftet" ? "status-open" : "status-reduced")
                    }
                  >
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="garden-note">
          iVvy har et dokumenteret API (getBookingList m.fl.), men brug af det koster ekstra ifølge deres prisliste — tjek med jeres iVvy-kontakt om aftalen dækker API-adgang.
        </div>
      </div>

      {/* Public events from snm.dk */}
      <div className="section-divider">
        <span className="label"><CalendarDays size={13} /> Offentlige arrangementer (snm.dk)</span>
        <span className="line" />
      </div>

      <div className="specimen-tag" style={{ marginBottom: 14 }}>
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
        <div className="panel-title">Kommende åbne arrangementer</div>
        <div className="panel-note">Rundvisninger, foredrag, familieaktiviteter — åbne for almindelige besøgende</div>
        <div className="table-scroll">
        <table className="stations">
          <thead>
            <tr>
              <th>Dato</th>
              <th>Tid</th>
              <th>Arrangement</th>
              <th>Sted</th>
              <th>Målgruppe</th>
            </tr>
          </thead>
          <tbody>
            {publicEvents.map((e) => (
              <tr key={e.navn + e.dato}>
                <td>{e.dato}</td>
                <td>{e.tid}</td>
                <td>{e.navn}</td>
                <td>{e.sted}</td>
                <td>{e.målgruppe}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="garden-note">
          snm.dk blokerer automatiseret hentning (robots.txt), så disse er eksempeldata — kobl i stedet på en RSS-feed eller CMS-API fra hjemmesiden, hvis en sådan findes.
        </div>
      </div>

      {/* Tomorrow section */}
      <div className="section-divider">
        <span className="label"><CalendarDays size={13} /> Forudsalg — kommende 7 dage</span>
        <span className="line" />
      </div>

      <div className="section-divider sub">
        <span className="label"><Users size={13} /> Museet</span>
        <span className="line" />
      </div>

      <div className="specimen-tag" style={{ marginBottom: 14 }}>
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
        <div className="panel-title">Forudsolgte billetter pr. dag</div>
        <div className="panel-note">Navipartner · online/forudsalg, 7 dage frem · Museet</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={sevenDayData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(28,42,31,0.10)" />
            <XAxis
              dataKey="dag"
              tickLine={false}
              axisLine={false}
              tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#5b6b66" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                fontFamily: "IBM Plex Mono",
                fontSize: 12,
                border: "1px solid #1c2a1f",
                borderRadius: 0,
              }}
            />
            <Bar dataKey="antal" fill="#3c5a44" radius={[1, 1, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="section-divider sub">
        <span className="label">I morgen i detaljer · Museet</span>
        <span className="line" />
      </div>

      <div className="tomorrow-grid">
        <SpecimenTag eyebrow={<><Ticket size={12} /> Forudsolgte billetter</>}>
          <div className="hero-value">572<small>stk.</small></div>
          <div className="hero-delta up"><TrendingUp size={13} /> +8% vs. i går på samme tidspunkt</div>
          <ul className="type-breakdown">
            {tomorrowTicketBreakdown.map((t) => (
              <li key={t.type}>
                <span className="t-type">{t.type}</span>
                <span className="t-antal">{t.antal}</span>
              </li>
            ))}
          </ul>
          <div className="garden-note">
            Kun online/forudsalg — dagsalget i døren tælles først med i morgen.
          </div>
        </SpecimenTag>

        <div className="specimen-tag">
          <span className="corner tl" /><span className="corner tr" />
          <span className="corner bl" /><span className="corner br" />
          <div className="panel-title">Bookede grupper</div>
          <div className="panel-note">Skoler, firmaer, arrangementer · Museet</div>
          <ul className="booked-list">
            {tomorrowBookedGroups.map((g) => (
              <li key={g.navn}>
                <span className="booked-name">{g.navn}</span>
                <span className="booked-meta">{g.tid} · {g.antal} pers.</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="section-divider sub">
        <span className="label"><Leaf size={13} /> Palmehuset</span>
        <span className="line" />
      </div>

      <div className="specimen-tag" style={{ marginBottom: 14 }}>
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
        <div className="panel-title">Forudsolgte billetter pr. dag</div>
        <div className="panel-note">Navipartner · online/forudsalg, 7 dage frem · Palmehuset</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={palmehusSevenDayData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(28,42,31,0.10)" />
            <XAxis
              dataKey="dag"
              tickLine={false}
              axisLine={false}
              tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#5b6b66" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                fontFamily: "IBM Plex Mono",
                fontSize: 12,
                border: "1px solid #1c2a1f",
                borderRadius: 0,
              }}
            />
            <Bar dataKey="antal" fill="#b9832f" radius={[1, 1, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="section-divider sub">
        <span className="label">I morgen i detaljer · Palmehuset</span>
        <span className="line" />
      </div>

      <div className="tomorrow-grid">
        <SpecimenTag eyebrow={<><Ticket size={12} /> Forudsolgte billetter</>}>
          <div className="hero-value">172<small>stk.</small></div>
          <div className="hero-delta up"><TrendingUp size={13} /> +6% vs. i går på samme tidspunkt</div>
          <ul className="type-breakdown">
            {palmehusTomorrowTicketBreakdown.map((t) => (
              <li key={t.type}>
                <span className="t-type">{t.type}</span>
                <span className="t-antal">{t.antal}</span>
              </li>
            ))}
          </ul>
          <div className="garden-note">
            Kun online/forudsalg — dagsalget i døren tælles først med i morgen.
          </div>
        </SpecimenTag>

        <div className="specimen-tag">
          <span className="corner tl" /><span className="corner tr" />
          <span className="corner bl" /><span className="corner br" />
          <div className="panel-title">Bookede grupper</div>
          <div className="panel-note">Skoler, firmaer, arrangementer · Palmehuset</div>
          <ul className="booked-list">
            {palmehusTomorrowBookedGroups.map((g) => (
              <li key={g.navn}>
                <span className="booked-name">{g.navn}</span>
                <span className="booked-meta">{g.tid} · {g.antal} pers.</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* European holiday overview — live via Nager Holidays API */}
      <div className="section-divider">
        <span className="label"><Globe2 size={13} /> Kommende helligdage i Europa</span>
        <span className="line" />
      </div>

      <div className="specimen-tag" style={{ marginBottom: 14 }}>
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div className="panel-title">Næste offentlige helligdag pr. land</div>
            <div className="panel-note">
              Live fra Nager Holidays API — relevant for udenlandsk besøgstal og Copenhagen Card-gæster. Danmark markeret til sammenligning.
            </div>
          </div>
          <button
            onClick={fetchNagerHolidays}
            disabled={nagerLoading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
              background: "transparent", border: "1px solid var(--line)",
              padding: "2px 6px", cursor: nagerLoading ? "default" : "pointer",
              opacity: nagerLoading ? 0.6 : 1, color: "var(--moss)", flexShrink: 0,
            }}
          >
            {nagerLoading ? <Loader2 size={10} className="spin" /> : <RefreshCw size={10} />}
          </button>
        </div>
        <ul className="europe-list">
          {NAGER_COUNTRIES.map((c) => {
            const h = nextNagerHoliday(c.code);
            return (
              <li key={c.code} className={c.erDK ? "is-dk" : ""}>
                <span className="europe-land">{c.navn}</span>
                <span className="europe-periode">
                  {nagerLoading && !nagerHolidays
                    ? "Henter…"
                    : h
                    ? `${h.localName || h.name} · ${new Date(h.date).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}`
                    : "Ingen data"}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="garden-note">
          {nagerError
            ? `Kunne ikke hente helligdage (${nagerError}).`
            : "Kilde: Nager Holidays API (nagerholidays.com) — offentlige helligdage, ingen API-nøgle nødvendig. Dækker ikke skole-/sommerferier, som varierer efter delstat/region."}
        </div>
      </div>

      <footer>
        Mockup — designet til at afklare hvilke datakilder der skal kobles på (billetsystem, adgangstæller, DMI, vagtplan). Designet af Kommercielle Aktiviteter (fejl kan derfor forekomme).
      </footer>
    </div>
  );
}
