document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const summaryCards = document.getElementById('summary-cards');
    const scheduleContainer = document.getElementById('schedule-container');
    const errorContainer = document.getElementById('error-container');
    const toastContainer = document.getElementById('toast-container');
    
    const API_SOLVE = '/api/solve'; 
    const API_CURRICULUM = '/api/curriculum';

    // State untuk menyimpan kurikulum mentah (untuk cek prasyarat) & MK yang sudah di-klik
    let curriculumData = {};
    let selectedCourses = new Set();

    // 1. Ambil data kurikulum dari backend saat web pertama kali dimuat
    async function fetchCurriculum() {
        try {
            const res = await fetch(API_CURRICULUM);
            if (res.ok) {
                curriculumData = await res.json();
            }
        } catch (e) {
            console.error("Gagal memuat data kurikulum");
        }
    }
    fetchCurriculum();

    // 2. Logika Pembuatan Jadwal
    generateBtn.addEventListener('click', async () => {
        errorContainer.classList.add('hidden');
        scheduleContainer.classList.add('hidden');
        scheduleContainer.innerHTML = '';
        generateBtn.disabled = true;
        generateBtn.innerText = 'Memproses...';
        
        // Reset pilihan kelas setiap kali jadwal di-generate ulang
        selectedCourses.clear();

        try {
            const response = await fetch(API_SOLVE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error(`Server Error (${response.status}): Silakan cek Vercel Logs.`);
            }

            const data = await response.json();

            document.getElementById('total-semesters').innerText = data.total_semesters;
            document.getElementById('total-sks').innerText = data.total_sks;
            summaryCards.classList.remove('hidden');

            data.semesters.forEach((courses, index) => {
                const semesterNum = index + 1;
                renderSemesterBlock(semesterNum, courses);
            });

            scheduleContainer.classList.remove('hidden');

        } catch (error) {
            errorContainer.innerHTML = `<strong>Error:</strong> ${error.message}`;
            errorContainer.classList.remove('hidden');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerText = 'Buat Jadwal Studi';
        }
    });

    // 3. Render DOM (Perhatikan tambahan data-code pada course-card)
    function renderSemesterBlock(semesterNum, courses) {
        const parityClass = semesterNum % 2 !== 0 ? 'semester-odd' : 'semester-even';
        let totalSksSemester = courses.reduce((sum, c) => sum + (c.sks || 0), 0);

        const block = document.createElement('div');
        block.className = `semester-block ${parityClass}`;
        
        const header = document.createElement('div');
        header.className = 'semester-header';
        header.innerHTML = `
            <h2>Semester ${semesterNum}</h2>
            <span><strong>${totalSksSemester} SKS</strong> | ${courses.length} Mata Kuliah</span>
        `;
        block.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'courses-grid';

        if (courses.length === 0) {
            grid.innerHTML = `<p style="color: #64748B; font-style: italic;">Tidak ada mata kuliah (Menunggu Prasyarat/Paritas).</p>`;
        } else {
            courses.forEach(course => {
                const card = document.createElement('div');
                card.className = 'course-card';
                // Menyimpan kode MK ke dalam atribut HTML agar bisa dibaca saat diklik
                card.dataset.code = course.code; 
                card.innerHTML = `
                    <span class="course-code">${course.code}</span>
                    <h3 class="course-name">${course.name}</h3>
                    <p class="course-sks">SKS: ${course.sks}</p>
                `;
                grid.appendChild(card);
            });
        }

        block.appendChild(grid);
        scheduleContainer.appendChild(block);
    }

    // 4. Logika Interaksi Klik Mata Kuliah (Event Delegation)
    scheduleContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.course-card');
        if (!card) return; // Jika yang diklik bukan kartu, abaikan

        const code = card.dataset.code;
        const courseInfo = curriculumData[code];
        if (!courseInfo) return;

        // Jika MK sudah diambil (dipilih), maka batalkan pilihan
        if (selectedCourses.has(code)) {
            // Cek apakah ada MK lanjutan yang sudah diambil yang bergantung pada MK ini
            const dependents = Array.from(selectedCourses).filter(c => curriculumData[c].req.includes(code));
            if (dependents.length > 0) {
                showToast('Tidak Bisa Dibatalkan', `Mata kuliah ini adalah prasyarat untuk mata kuliah yang sudah Anda ambil.`, 'error');
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 400);
                return;
            }

            selectedCourses.delete(code);
            card.classList.remove('selected');
            return;
        }

        // Jika belum diambil, cek prasyaratnya (req)
        const requirements = courseInfo.req || [];
        
        // Filter prasyarat yang belum ada di dalam Set selectedCourses
        const missingReqs = requirements.filter(reqCode => !selectedCourses.has(reqCode));

        if (missingReqs.length > 0) {
            // Ambil nama-nama MK prasyarat yang kurang agar pesan lebih informatif
            const missingNames = missingReqs.map(r => curriculumData[r] ? curriculumData[r].name : r).join(', ');
            
            showToast('Prasyarat Belum Lulus!', `Anda harus mengambil <strong>${missingNames}</strong> terlebih dahulu.`, 'error');
            
            // Tambahkan animasi goyang
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 400);
        } else {
            // Prasyarat terpenuhi, berhasil diambil
            selectedCourses.add(code);
            card.classList.add('selected');
        }
    });

    // 5. Fungsi untuk menampilkan Notifikasi Melayang (Toast)
    function showToast(title, message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;
        
        toastContainer.appendChild(toast);

        // Hilangkan otomatis setelah 3.5 detik
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
