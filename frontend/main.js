document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const summaryCards = document.getElementById('summary-cards');
    const scheduleContainer = document.getElementById('schedule-container');
    const errorContainer = document.getElementById('error-container');
    
    // Sesuaikan URL ini dengan port Flask Anda
    const API_URL = '/api/solve';

    generateBtn.addEventListener('click', async () => {
        // Reset UI
        errorContainer.classList.add('hidden');
        scheduleContainer.classList.add('hidden');
        scheduleContainer.innerHTML = '';
        generateBtn.disabled = true;
        generateBtn.innerText = 'Memproses...';

        try {
            // Memanggil API Backend
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Backend otomatis menggunakan curriculum.json
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Terjadi kesalahan pada server.');
            }

            // Tampilkan Ringkasan
            document.getElementById('total-semesters').innerText = data.total_semesters;
            document.getElementById('total-sks').innerText = data.total_sks;
            summaryCards.classList.remove('hidden');

            // Render Jadwal per Semester
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
            generateBtn.innerText = 'Generate Schedule';
        }
    });

    function renderSemesterBlock(semesterNum, courses) {
        // Cek paritas untuk pewarnaan
        const parityClass = semesterNum % 2 !== 0 ? 'semester-odd' : 'semester-even';
        let totalSksSemester = courses.reduce((sum, c) => sum + (c.sks || 0), 0);

        const block = document.createElement('div');
        block.className = `semester-block ${parityClass}`;
        
        // Buat Header Semester
        const header = document.createElement('div');
        header.className = 'semester-header';
        header.innerHTML = `
            <h2>Semester ${semesterNum}</h2>
            <span><strong>${totalSksSemester} SKS</strong> | ${courses.length} Mata Kuliah</span>
        `;
        block.appendChild(header);

        // Buat Grid Mata Kuliah
        const grid = document.createElement('div');
        grid.className = 'courses-grid';

        if (courses.length === 0) {
            grid.innerHTML = `<p style="color: #666; font-style: italic;">Tidak ada mata kuliah (Menunggu Prasyarat/Paritas).</p>`;
        } else {
            courses.forEach(course => {
                const card = document.createElement('div');
                card.className = 'course-card';
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
});
