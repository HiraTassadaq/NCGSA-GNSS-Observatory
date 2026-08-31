import React, { useState, useMemo } from "react";
import {
  Users,
  GraduationCap,
  BriefcaseBusiness,
  Search,
  Building2,
  Award,
  X,
  Layers3,
} from "lucide-react";

import "./Contributor.css";
import Footer from "../../components/Footer"; 
/* =========================================================
   PROFESSIONALS / RESEARCHERS / LEADERSHIP
========================================================= */

const professionals = [
  {
    id: "dr-najam",
    name: "Prof. Dr. Najam Abbas Naqvi",
    affiliation:
      "National Center of GIS and Space Applications - NCGSA",
    designation: "Project Director / Chairman NCGSA",
    roleType: "Leadership",
    roleBadge: "LEADERSHIP & PI",
    badgeColor: "#a855f7",
    image: "/assets/contributors/DrNajam.png",
  },

  {
    id: "daniyal-raza",
    name: "Daniyal Raza Kazmi",
    affiliation:
      "National Center of GIS and Space Applications - NCGSA",
    designation: "Research Associate GNSS",
    roleType: "Researcher",
    roleBadge: "RESEARCH ASSOCIATE",
    badgeColor: "#38bdf8",
    image: "/assets/contributors/Daniyal.png",
  },

  {
    id: "hira-tassadaq",
    name: "Hira Tassadaq",
    affiliation:
      "National Center of GIS and Space Applications - NCGSA",
    designation: "Research Assistant Software",
    roleType: "Researcher",
    roleBadge: "RESEARCH ASSISTANT",
    badgeColor: "#38bdf8",
    image: "/assets/contributors/Hira.jpeg",
  },
];

/* =========================================================
   STUDENT INTERNS
========================================================= */

const interns = [
  {
    id: "abrar-hussain",
    name: "Abrar Hussain",
    affiliation: "Institute of Space Technology, Islamabad",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Abrar.jpg",
  },

  {
    id: "amna-rasheed",
    name: "Amna Rasheed",
    affiliation:
      "University of Engineering and Technology, Taxila",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Amna.png",
  },

  {
    id: "fizza-firdous",
    name: "Fizza Firdous",
    affiliation: "Institute of Space Technology, Islamabad",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Fizza.jpeg",
  },

  {
    id: "abdullah-hussain",
    name: "Muhammad Abdullah Hussain",
    affiliation: "Foundation University, Islamabad",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Abdullah.jpeg",
  },

  {
    id: "huzaifa",
    name: "Muhammad Huzaifa",
    affiliation: "Quaid-E-Azam University, Islamabad",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Huzaifa.jpg",
  },

  {
    id: "omaima-latif",
    name: "Omaima Latif",
    affiliation:
      "National University of Modern Languages, Rawalpindi",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Omaima.jpeg",
  },

  {
    id: "shehryar-ali",
    name: "Shehryar Ali",
    affiliation:
      "SZABIST University of Science & Technology, Islamabad",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Shehryar.jpeg",
  },

  {
    id: "azeem-ahmad",
    name: "Syed Azeem Ahmad",
    affiliation:
      "University of Engineering and Technology, Taxila",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Azeem.jpeg",
  },

  {
    id: "hora-naqvi",
    name: "Syeda Hora Naqvi",
    affiliation: "Institute of Space Technology, Islamabad",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Hora.jpeg",
  },

  {
    id: "tooba-baqai",
    name: "Tooba Baqai",
    affiliation: "Riphah International University, Islamabad",
    roleType: "Intern",
    roleBadge: "INTERN CONTRIBUTOR",
    image: "/assets/contributors/Tooba.jpg",
  },
];

const allContributors = [...professionals, ...interns];

/* =========================================================
   INSTITUTIONS
========================================================= */

const institutions = [
  "All Institutions",

  "National Center of GIS and Space Applications - NCGSA",

  "Institute of Space Technology, Islamabad",

  "University of Engineering and Technology, Taxila",

  "Quaid-E-Azam University, Islamabad",

  "Foundation University, Islamabad",

  "National University of Modern Languages, Rawalpindi",

  "SZABIST University of Science & Technology, Islamabad",

  "Riphah International University, Islamabad",
];

/* =========================================================
   CONTRIBUTOR AVATAR
========================================================= */

function ContributorAvatar({ src, name }) {
  const [imgFailed, setImgFailed] = useState(false);

  const getInitials = (fullName) => {
    const parts = fullName
      .replace(
        /^(Prof\.|Dr\.|Syed|Syeda|Muhammad)\s+/gi,
        ""
      )
      .trim()
      .split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="contributor-avatar-frame">
      {!imgFailed ? (
        <img
          src={src}
          alt={name}
          className="contributor-avatar-img"
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      ) : (
        <div className="contributor-avatar-fallback">
          <span>{getInitials(name)}</span>
        </div>
      )}

      <div className="avatar-corner-accent top-left" />
      <div className="avatar-corner-accent top-right" />
      <div className="avatar-corner-accent bottom-left" />
      <div className="avatar-corner-accent bottom-right" />
    </div>
  );
}

/* =========================================================
   PROFESSIONAL CARD
========================================================= */

function ProfessionalCard({ person, index }) {
  const isLead = person.roleType === "Leadership";

  return (
    <article
      className={`contributor-tech-card ${
        isLead ? "card-leadership" : "card-pro"
      }`}
    >
      {/* TOP BAR */}
      <div className="card-top-bar">
        <span
          className="card-role-chip"
          style={{
            color: person.badgeColor || "#38bdf8",
            borderColor: `${person.badgeColor || "#38bdf8"}40`,
            backgroundColor: `${person.badgeColor || "#38bdf8"}12`,
          }}
        >
          {isLead ? (
            <Award size={12} />
          ) : (
            <BriefcaseBusiness size={12} />
          )}

          <span>{person.roleBadge}</span>
        </span>

        <span className="card-index-tag">
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* AVATAR */}
      <div className="card-avatar-row">
        <ContributorAvatar
          src={person.image}
          name={person.name}
        />
      </div>

      {/* INFORMATION */}
      <div className="card-info-block">
        <h3 className="contributor-name">
          {person.name}
        </h3>

        {/* Designation */}
        {person.designation && (
          <div className="contributor-designation-badge">
            <span>{person.designation}</span>
          </div>
        )}

        {/* Institution */}
        <div className="contributor-inst-row">
          <Building2
            size={13}
            className="text-cyan-400 shrink-0 mt-0.5"
          />

          <p>{person.affiliation}</p>
        </div>
      </div>

      {/* FOOTER */}
      {/* <div className="card-footer-strip">
        <span className="node-id-label">
          NCGSA GNSS NODE
        </span> */}

        {/* <span className="active-dot-pill">
          <span className="pulse-dot" />
          ACTIVE
        </span>
      </div> */}
    </article>
  );
}

/* =========================================================
   INTERN CARD
========================================================= */

function InternCard({ person, index }) {
  return (
    <article className="contributor-tech-card card-intern">
      {/* TOP BAR */}
      <div className="card-top-bar">
        <span
          className="card-role-chip"
          style={{
            color: "#34d399",
            borderColor: "#34d39940",
            backgroundColor: "#34d39912",
          }}
        >
          <GraduationCap size={12} />

          <span>{person.roleBadge}</span>
        </span>

        <span className="card-index-tag">
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* AVATAR */}
      <div className="card-avatar-row">
        <ContributorAvatar
          src={person.image}
          name={person.name}
        />
      </div>

      {/* INFORMATION */}
      <div className="card-info-block">
        <h3 className="contributor-name">
          {person.name}
        </h3>

        {/* Institution */}
        <div className="contributor-inst-row">
          <Building2
            size={13}
            className="text-cyan-400 shrink-0 mt-0.5"
          />

          <p>{person.affiliation}</p>
        </div>
      </div>

      {/* FOOTER */}
      {/* <div className="card-footer-strip">
        <span className="node-id-label">
          NCGSA GNSS NODE
        </span>

        <span className="active-dot-pill">
          <span className="pulse-dot" />
          ACTIVE
        </span>
      </div> */}
    </article>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Contributor() {
  const [activeTab, setActiveTab] = useState("all");

  const [selectedInst, setSelectedInst] =
    useState("All Institutions");

  const [searchQuery, setSearchQuery] =
    useState("");

  /* =====================================================
     FILTER PROFESSIONALS
  ===================================================== */

  const filteredProfessionals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return professionals.filter((person) => {
      /* Institution */
      if (
        selectedInst !== "All Institutions" &&
        person.affiliation !== selectedInst
      ) {
        return false;
      }

      /* Search */
      if (!query) return true;

      return (
        person.name.toLowerCase().includes(query) ||
        person.affiliation.toLowerCase().includes(query) ||
        person.designation
          ?.toLowerCase()
          .includes(query) ||
        person.roleBadge
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [selectedInst, searchQuery]);

  /* =====================================================
     FILTER INTERNS
  ===================================================== */

  const filteredInterns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return interns.filter((person) => {
      /* Institution */
      if (
        selectedInst !== "All Institutions" &&
        person.affiliation !== selectedInst
      ) {
        return false;
      }

      /* Search */
      if (!query) return true;

      return (
        person.name.toLowerCase().includes(query) ||
        person.affiliation.toLowerCase().includes(query) ||
        person.roleBadge.toLowerCase().includes(query)
      );
    });
  }, [selectedInst, searchQuery]);

  /* =====================================================
     COUNTS
  ===================================================== */

  const internCount = interns.length;
  const professionalCount = professionals.length;
  const totalCount = allContributors.length;

  const filteredCount =
    activeTab === "professionals"
      ? filteredProfessionals.length
      : activeTab === "interns"
        ? filteredInterns.length
        : filteredProfessionals.length +
          filteredInterns.length;

  /* =====================================================
     RESET FILTERS
  ===================================================== */

  const clearFilters = () => {
    setActiveTab("all");
    setSelectedInst("All Institutions");
    setSearchQuery("");
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="contributors-page">

      {/* =================================================
          HERO SECTION
      ================================================= */}

      <header className="contributors-hero">
        <div className="contributors-grid-bg" />

        <div className="contributors-glow-orb" />

        <div className="contributors-hero-container">

          {/* EYEBROW */}
          <div className="contributors-eyebrow">
            <span className="eyebrow-line" />

            <Users
              size={15}
              className="text-cyan-400"
            />

            <span>
              NCGSA SPACE GEODESY HUMAN TALENT NETWORK
            </span>

            <span className="eyebrow-line" />
          </div>

          {/* TITLE */}
          <h1>
            The Minds <em>Behind the Data</em>
          </h1>

          {/* SEARCH */}
          <div className="contributors-search-wrap">
            <div className="contributors-search-bar">

              <Search
                size={18}
                className="text-cyan-400 shrink-0"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search contributors by name, institution, or role..."
                aria-label="Search contributors"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() =>
                    setSearchQuery("")
                  }
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}

            </div>
          </div>

          {/* METRICS */}
          <div className="contributors-metric-strip">

            <div className="metric-item">
              <strong>{totalCount}</strong>
              <span>TOTAL CONTRIBUTORS</span>
            </div>

            <div className="metric-sep" />

            <div className="metric-item">
              <strong>{professionalCount}</strong>
              <span>RESEARCHERS & LEADERSHIP</span>
            </div>

            <div className="metric-sep" />

            <div className="metric-item">
              <strong>{internCount}</strong>
              <span>STUDENT INTERNS</span>
            </div>

          </div>
        </div>
      </header>

      {/* =================================================
          FILTER NAVIGATION
      ================================================= */}

      <nav className="contributors-filter-nav">

        <div className="contributors-filter-inner">

          {/* TABS */}
          <div className="contributors-tabs">

            <button
              type="button"
              className={`tab-btn ${
                activeTab === "all"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("all")
              }
            >
              <Users size={15} />

              <span>
                All Contributors
              </span>

              <span className="tab-pill">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              className={`tab-btn ${
                activeTab === "professionals"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("professionals")
              }
            >
              <BriefcaseBusiness size={15} />

              <span>
                Researchers & Leadership
              </span>

              <span className="tab-pill">
                {professionalCount}
              </span>
            </button>

            <button
              type="button"
              className={`tab-btn ${
                activeTab === "interns"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("interns")
              }
            >
              <GraduationCap size={15} />

              <span>
                Student Interns
              </span>

              <span className="tab-pill">
                {internCount}
              </span>
            </button>

          </div>

          {/* INSTITUTION FILTER */}
          <div className="institution-filter-wrap">

            <Building2
              size={14}
              className="text-cyan-400 shrink-0"
            />

            <select
              value={selectedInst}
              onChange={(e) =>
                setSelectedInst(e.target.value)
              }
              className="institution-select"
              aria-label="Filter by Institution"
            >
              {institutions.map((inst) => (
                <option
                  key={inst}
                  value={inst}
                >
                  {inst}
                </option>
              ))}
            </select>

          </div>

        </div>
      </nav>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="contributors-main-wrap">

        {/* RESULTS HEADER */}
        <div className="contributors-results-header">

          <div className="results-count-text">

            {/* <span>
              Showing{" "}
              <strong>{filteredCount}</strong>{" "}
              of {totalCount} members
            </span> */}

            {(searchQuery ||
              activeTab !== "all" ||
              selectedInst !==
                "All Institutions") && (
              <button
                type="button"
                className="clear-all-filter-btn"
                onClick={clearFilters}
              >
                Reset Filters
                <X size={12} />
              </button>
            )}

          </div>

        </div>

        {/* =================================================
            NO RESULTS
        ================================================= */}

        {filteredCount === 0 ? (
          <div className="contributors-empty-state">

            <Users
              size={48}
              className="text-cyan-400 mb-3 opacity-60"
            />

            <h3>
              No Contributors Found
            </h3>

            <p>
              No team members match your current
              filter or search criteria.
            </p>

            <button
              type="button"
              className="reset-btn"
              onClick={clearFilters}
            >
              Reset All Filters
            </button>

          </div>
        ) : (
          <>

            {/* =================================================
                PROFESSIONALS SECTION
            ================================================= */}

            {(activeTab === "all" ||
              activeTab === "professionals") &&
              filteredProfessionals.length > 0 && (
                <section className="contributors-group">

                  <div className="contributors-group-header">

                    <div>
                      <span className="contributors-group-eyebrow">
                        NCGSA RESEARCH NETWORK
                      </span>

                      <h2>
                        Researchers & Leadership
                      </h2>
                    </div>

                    <span className="contributors-group-count">
                      {filteredProfessionals.length} MEMBERS
                    </span>

                  </div>

                  <div className="contributors-cards-grid">

                    {filteredProfessionals.map(
                      (person, idx) => (
                        <ProfessionalCard
                          key={person.id}
                          person={person}
                          index={idx}
                        />
                      )
                    )}

                  </div>

                </section>
              )}

            {/* =================================================
                INTERNS SECTION — NEW ROW
            ================================================= */}

            {(activeTab === "all" ||
              activeTab === "interns") &&
              filteredInterns.length > 0 && (
                <section className="contributors-group contributors-intern-group">

                  <div className="contributors-group-header">

                    <div>
                      <span className="contributors-group-eyebrow">
                        STUDENT RESEARCH PROGRAM
                      </span>

                      <h2>
                        Interns
                      </h2>
                    </div>

                    <span className="contributors-group-count">
                      {filteredInterns.length} MEMBERS
                    </span>

                  </div>

                  <div className="contributors-cards-grid">

                    {filteredInterns.map(
                      (person, idx) => (
                        <InternCard
                          key={person.id}
                          person={person}
                          index={idx}
                        />
                      )
                    )}

                  </div>

                </section>
              )}

          </>
        )}

        {/* =================================================
            INSTITUTIONAL COLLABORATION
        ================================================= */}

        {/* <section className="contributors-partnership-section">

          <div className="partnership-header">

            <Layers3
              size={22}
              className="text-cyan-400 shrink-0"
            />

            <div>

              <h3>
                Institutional Collaboration
              </h3>

              <p>
                The NCGSA GNSS Observatory fosters
                space geodesy, multi-constellation
                satellite navigation research, and
                technical capacity building across
                premier academic institutions in
                Pakistan.
              </p>

            </div>

          </div>

        </section> */}

      </main>
      <Footer />
      
    </div>
  );
}
