import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

export default function App() {

  // LOGIN
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // LANGUAGE
  const [lang, setLang] = useState("en");

  const t = {
    en: {
      login: "Login",
      course: "Course",
      month: "Month",
      save: "Save",
      from: "From",
      via: "Via",
      to: "To"
    },
    si: {
      login: "ඇතුල් වන්න",
      course: "පාඨමාලාව",
      month: "මාසය",
      save: "සුරකින්න",
      from: "ආරම්භය",
      via: "මාරුව",
      to: "අවසන්"
    }
  };

  // DATA
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState({});
  const [course, setCourse] = useState("");
  const [month, setMonth] = useState("");
  const [printDepot, setPrintDepot] = useState("");

  // LOGIN
  const login = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .eq("password", password)
      .single();

    if (!data) alert("Login failed");
    else {
      setUser(data);
      if (data.role === "rep") setCourse(data.course);
    }
  };

  // LOAD STUDENTS
  useEffect(() => {
    if (user) {
      supabase.from("students").select("*").then(({ data }) => {
        setStudents(data || []);
      });
    }
  }, [user]);

  // LOAD LAST MONTH
  useEffect(() => {
    if (month && course) {
      const d = new Date(month + "-01");
      d.setMonth(d.getMonth() - 1);
      const prev = d.toISOString().slice(0, 7);

      supabase
        .from("season_requests")
        .select("*")
        .eq("course", course)
        .eq("month", prev)
        .then(({ data }) => {

          let temp = {};
          data?.forEach(r => {
            temp[r.student_id] = {
              selected: true,
              depot: r.depot,
              start: r.start_point,
              interchange: r.interchange_point,
              end: r.end_point,
              fare: r.fare || ""
            };
          });

          setSelected(temp);
        });
    }
  }, [month, course]);

  // SELECT
  const toggle = (id) => {
    setSelected(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        selected: !prev[id]?.selected,
        depot: prev[id]?.depot || "Balangoda"
      }
    }));
  };

  const update = (id, field, value) => {
    setSelected(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  // SAVE
  const save = async () => {
    const records = Object.keys(selected)
      .filter(id => selected[id]?.selected)
      .map(id => ({
        student_id: parseInt(id),
        course,
        month,
        depot: selected[id].depot,
        start_point: selected[id].start,
        interchange_point: selected[id].interchange,
        end_point: selected[id].end,
        fare: selected[id].fare
      }));

    const { error } = await supabase.from("season_requests").insert(records);

    if (error) alert("Duplicate data!");
    else alert("Saved");
  };

  // PRINT
  const print = (depot) => {
    setPrintDepot(depot);
    setTimeout(() => {
      window.print();
      setPrintDepot("");
    }, 300);
  };

  // TOTALS
  const totalStudents = Object.values(selected).filter(s => s.selected && s.depot === printDepot).length;

  const totalFare = Object.values(selected)
    .filter(s => s.selected && s.depot === printDepot)
    .reduce((sum, s) => sum + (parseFloat(s.fare) || 0), 0);

  // LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>{t[lang].login}</h2>

        <button onClick={() => setLang("en")}>EN</button>
        <button onClick={() => setLang("si")}>සිංහල</button>

        <br /><br />

        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

        <br /><br />
        <button onClick={login}>{t[lang].login}</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 15 }}>

      <h3>{user.role}</h3>

      <button onClick={() => setLang("en")}>EN</button>
      <button onClick={() => setLang("si")}>සිංහල</button>

      <br /><br />

      {user.role !== "rep" &&
        <input placeholder={t[lang].course} value={course} onChange={e => setCourse(e.target.value)} />
      }

      <input type="month" value={month} onChange={e => setMonth(e.target.value)} />

      <br /><br />

      {students
        .filter(s => !course || s.course === course)
        .map(s => (
          <div key={s.id} style={{ border: "1px solid #ccc", margin: 5, padding: 5 }}>

            <input type="checkbox"
              checked={selected[s.id]?.selected || false}
              onChange={() => toggle(s.id)}
            />

            {s.name}

            {selected[s.id]?.selected && (
              <div>
                <select onChange={e => update(s.id, "depot", e.target.value)}>
                  <option>Balangoda</option>
                  <option>Ratnapura</option>
                </select>

                <input placeholder={t[lang].from} onChange={e => update(s.id, "start", e.target.value)} />
                <input placeholder={t[lang].via} onChange={e => update(s.id, "interchange", e.target.value)} />
                <input placeholder={t[lang].to} onChange={e => update(s.id, "end", e.target.value)} />
                <input placeholder="Fare" onChange={e => update(s.id, "fare", e.target.value)} />
              </div>
            )}
          </div>
        ))}

      <button onClick={save}>{t[lang].save}</button>

      <br /><br />

      <button onClick={() => print("Balangoda")}>Print Balangoda</button>
      <button onClick={() => print("Ratnapura")}>Print Ratnapura</button>

      {/* PRINT */}
      {printDepot && (
        <div className="print-area">
          <div className="page">

            <img src="/logo.png" style={{ width: 80 }} />

            <div className="center bold">SABARAGAMUWA BUS COMPANY</div>
            <div className="center">College Of Technology - Ratnapura</div>

            <br />

            <div>The General Manager - {printDepot} Depot</div>

            <br />

            <div className="row">
              <div>Course: {course}</div>
              <div>Month: {month}</div>
            </div>

            <table className="main-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Name</th>
                  <th>From</th>
                  <th>Via</th>
                  <th>To</th>
                  <th>Fare</th>
                  <th>Signature</th>
                </tr>
              </thead>

              <tbody>
                {Object.keys(selected).map((id, i) => {
                  const s = students.find(x => x.id === parseInt(id));
                  const d = selected[id];

                  if (!d?.selected || d.depot !== printDepot) return null;

                  return (
                    <tr key={id}>
                      <td>{i + 1}</td>
                      <td>{s?.name}</td>
                      <td>{d.start}</td>
                      <td>{d.interchange}</td>
                      <td>{d.end}</td>
                      <td>{d.fare}</td>
                      <td></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <br />

            <div>Total Students: {totalStudents}</div>
            <div>Total Fare: {totalFare}</div>

            <br /><br />

            <div>Instructor / HOD ______________________</div>
            <div className="right">Director / Registrar</div>

          </div>
        </div>
      )}

    </div>
  );
}