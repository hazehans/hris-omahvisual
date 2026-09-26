const fs = require('fs');
let code = fs.readFileSync('Dashboard.jsx', 'utf8');

const insertPagination = (tab, totalItemsStr, arrayStr) => {
    const mapPos = code.indexOf(arrayStr);
    if (mapPos !== -1) {
        const insertPos = code.indexOf('</table>', mapPos) + 8;
        const divPos = code.indexOf('</div>', insertPos) + 6;
        const start = code.substring(0, divPos);
        const end = code.substring(divPos);
        const pag = `
              <div className="mt-4">
                <TablePagination currentPage={getPage('${tab}')} totalPages={Math.ceil(${totalItemsStr} / getLimit('${tab}'))} rowsPerPage={getLimit('${tab}')} setPage={(p) => setPage('${tab}', p)} setRowsPerPage={(l) => setLimit('${tab}', l)} totalItems={${totalItemsStr}} />
              </div>`;
        code = start + pag + end;
    }
};

insertPagination('KARYAWAN', 'sortedEmployees.length', 'paginatedEmployees.map(');
insertPagination('ABSENSI', 'logs.length', 'paginatedLogs.map(');
insertPagination('DAILY_LOG', 'dailyLogs.length', 'paginatedDailyLogs.map(');
insertPagination('CUTI_PENDING', 'filteredPending.length', 'paginatedPending.map(');
insertPagination('CUTI_HISTORY', 'filteredHistory.length', 'paginatedHistory.map(');

const kontrakStart = code.indexOf("{activeTab === 'KONTRAK'");
if (kontrakStart !== -1) {
    const nextTab = code.indexOf('</main>', kontrakStart);
    if(nextTab !== -1) {
       code = code.substring(0, kontrakStart) + code.substring(nextTab);
    }
}

code = code.replace(/\{\s*id:\s*'KONTRAK'.*?\},/g, '');
code = code.replace(/\{\s*id:\s*'KARYAWAN'.*?\},/, `{ id: 'KARYAWAN', label: 'Karyawan & Kontrak', icon: Users },`);

fs.writeFileSync('Dashboard.jsx', code);
console.log('Done!');
