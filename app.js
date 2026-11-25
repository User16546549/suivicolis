// SuiviColis - demo TP3 (Express + Azure SQL via mssql/tedious, 100 % JavaScript)
const express = require('express');
const sql = require('mssql');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 8080; // App Service injecte PORT
// Connection string de type SQLAzure nommee SuiviColis -> SQLAZURECONNSTR_SuiviColis
const CONN = process.env.SQLAZURECONNSTR_SuiviColis || process.env.SQL_CONN;
let pool;
async function getPool() {
  if (!pool) pool = await sql.connect(CONN);
  return pool;
}
app.get('/health', (req, res) => res.type('text').send('OK'));
app.get('/', async (req, res) => {
  try {
    const p = await getPool();
    await p.request().query(`IF OBJECT_ID('dbo.visites') IS NULL
      CREATE TABLE dbo.visites (id INT IDENTITY PRIMARY KEY,
      horodatage DATETIME2 DEFAULT SYSUTCDATETIME(), hote NVARCHAR(100))`);
    await p.request().input('hote', sql.NVarChar, os.hostname())
      .query('INSERT INTO dbo.visites (hote) VALUES (@hote)');
    const r = await p.request()
      .query('SELECT COUNT(*) AS total, MAX(horodatage) AS derniere FROM dbo.visites');
    const { total } = r.recordset[0];
    const derniere = new Date(r.recordset[0].derniere).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
    res.send(`<h1>SuiviColis - TLC (deploye par GitHub Actions)</h1>
      <p>Visites enregistrees : <b>${total}</b> (derniere : ${derniere})</p>
      <p>Instance : ${os.hostname()} - Node ${process.version}</p>`);
  } catch (e) {
    console.error('Erreur SQL :', e.message);
    res.status(500).send('<h1>Erreur base de donnees</h1><pre>' + e.message + '</pre>');
  }
});
app.listen(PORT, () => console.log(`SuiviColis en ecoute sur le port ${PORT}`));
