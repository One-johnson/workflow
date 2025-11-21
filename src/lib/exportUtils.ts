import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface Company {
  _id: string;
  name: string;
  description?: string;
  region?: string,
  branch?: string,
  createdAt: number;


}

export interface Member {
  _id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
   dateofBirth?: string;
    region?: string;
     gender?: string;
      ghCard?: string;
  position?: string;
  department?: string;
  status: string;
  dateJoined: number;
}

export function exportCompaniesToCSV(companies: Company[]) {
  const headers = [ "Name", "Description","Branch", "Region", "Created Date"];
  const rows = companies.map((c) => [
    c.name,
    c.description || "",
    c.branch || "",
    c.region || "",
    new Date(c.createdAt).toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, "companies.csv", "text/csv");
}

export function exportCompaniesToPDF(companies: Company[]) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Companies Report", 14, 22);

  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  autoTable(doc, {
    head: [["Company ID", "Name", "Description", "Created Date"]],
    body: companies.map((c) => [
      c.name,
    c.description || "",
    c.branch || "",
    c.region || "",
    new Date(c.createdAt).toLocaleDateString(),
    ]),
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save("companies.pdf");
}

export function exportMembersToCSV(members: Member[]) {
  const headers = [
    "Staff ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Position",
    "Address",
    "Date of Birth",
    "Company Region",
    "Company Location",
    "Department",
    "Status",
    "Date Joined",
  ];

  const rows = members.map((m) => [
    m.staffId,
    m.firstName,
    m.lastName,
    m.email,
    m.phone || "",
    m.position || "",
    m.address || "",
    m.dateofBirth || "",
    m.gender ||"",
    m.ghCard || "",
    m.region || "",
    m.department || "",
    m.status,
    new Date(m.dateJoined).toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, "members.csv", "text/csv");
}

export function exportMembersToPDF(members: Member[]) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Members Report", 14, 22);

  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  autoTable(doc, {
    head: [
      [  "Staff ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Position",
    "Address",
    "Date of Birth",
    "Company Region",
    "Company Location",
    "Department",
    "Status",
    "Date Joined",],
    ],
    body: members.map((m) => [
      m.staffId,
      `${m.firstName} ${m.lastName}`,
      m.email,
      m.position || "-",
      m.department || "-",
          m.address || "-",
              m.dateofBirth || "-",
                  m.gender || "-",
                      m.ghCard || "-",
                          m.region || "-",
      m.status,
      new Date(m.dateJoined).toLocaleDateString(),
    ]),
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save("members.pdf");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
