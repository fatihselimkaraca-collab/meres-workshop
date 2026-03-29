// ============================================
// MERES SANAT ATÖLYESİ — App Logic
// ============================================

// --- State ---
let currentLessonId = null;
let currentFilter = 'all';
let selectedPaymentStatus = 'paid';
let editingEnrollmentId = null;
let studentCache = [];

// ============================================
// NAVIGATION
// ============================================

function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const targetId = `page-${page}`;
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Load data for pages
  switch (page) {
    case 'home':
      loadLessons();
      break;
    case 'create-lesson':
      loadTeacherDropdown('lesson-teacher');
      setDefaultDate();
      break;
    case 'add-student':
      loadLessonDropdown();
      loadStudentCache();
      break;
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration);
}

// ============================================
// TEACHERS
// ============================================

async function loadTeacherDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const { data, error } = await supabase
    .from('teachers')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Teachers load error:', error);
    return;
  }

  // Preserve current value
  const currentVal = select.value;

  // Clear options except first
  select.innerHTML = '<option value="">Seçiniz...</option>';

  data.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    select.appendChild(opt);
  });

  // Restore value if it exists
  if (currentVal) select.value = currentVal;
}

function showAddTeacher() {
  const el = document.getElementById('teacher-inline');
  el.classList.toggle('hidden');
  if (!el.classList.contains('hidden')) {
    document.getElementById('new-teacher-name').focus();
  }
}

async function addTeacherInline() {
  const input = document.getElementById('new-teacher-name');
  const name = input.value.trim();
  if (!name) return;

  const { data, error } = await supabase
    .from('teachers')
    .insert({ name })
    .select()
    .single();

  if (error) {
    showToast('Eğitmen eklenemedi: ' + error.message);
    return;
  }

  input.value = '';
  document.getElementById('teacher-inline').classList.add('hidden');
  await loadTeacherDropdown('lesson-teacher');

  // Auto-select the new teacher
  document.getElementById('lesson-teacher').value = data.id;
  showToast('Eğitmen eklendi ✓');
}

// ============================================
// LESSONS — Load & Display
// ============================================

async function loadLessons() {
  const list = document.getElementById('lessons-list');
  const empty = document.getElementById('empty-state');

  // Fetch lessons with teacher info
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id, name, type, date, time, capacity, price,
      teachers ( name )
    `)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    console.error('Lessons load error:', error);
    showToast('Dersler yüklenemedi');
    return;
  }

  // Fetch enrollment counts per lesson
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('lesson_id, payment_status');

  // Build enrollment stats
  const stats = {};
  if (enrollments) {
    enrollments.forEach(e => {
      if (!stats[e.lesson_id]) {
        stats[e.lesson_id] = { total: 0, unpaid: 0 };
      }
      stats[e.lesson_id].total++;
      if (e.payment_status !== 'paid') {
        stats[e.lesson_id].unpaid++;
      }
    });
  }

  // Filter lessons
  const filtered = filterLessons(lessons, currentFilter);

  if (!filtered.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  list.innerHTML = filtered.map(lesson => {
    const s = stats[lesson.id] || { total: 0, unpaid: 0 };
    const isFull = s.total >= lesson.capacity;
    const teacherName = lesson.teachers?.name || '—';
    const dateStr = formatDate(lesson.date);

    return `
      <div class="lesson-card" onclick="openLessonDetail('${lesson.id}')">
        <div class="lesson-card-header">
          <span class="lesson-card-name">${escHtml(lesson.name)}</span>
          <span class="lesson-card-type">${escHtml(lesson.type)}</span>
        </div>
        <div class="lesson-card-meta">
          <span>📅 ${dateStr}</span>
          <span>🕐 ${lesson.time || '—'}</span>
          <span>👤 ${escHtml(teacherName)}</span>
        </div>
        <div class="lesson-card-footer">
          <span class="capacity-badge ${isFull ? 'full' : ''}">
            ${s.total} / ${lesson.capacity} kişi
          </span>
          ${s.unpaid > 0
            ? `<span class="unpaid-badge">${s.unpaid} ödenmemiş</span>`
            : `<span class="unpaid-badge clear">Tümü ödendi</span>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function filterLessons(lessons, filter) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filter) {
    case 'today': {
      const todayStr = formatISODate(today);
      return lessons.filter(l => l.date === todayStr);
    }
    case 'week': {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return lessons.filter(l => {
        const d = new Date(l.date);
        return d >= today && d <= weekEnd;
      });
    }
    case 'unpaid':
      // Will be filtered after stats, for simplicity re-filter after render
      // Actually we handle this differently - just show all for now
      return lessons;
    default:
      return lessons;
  }
}

// Filter chip click handler
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    loadLessons();
  });
});

// ============================================
// LESSONS — Create
// ============================================

function setDefaultDate() {
  const dateInput = document.getElementById('lesson-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = formatISODate(new Date());
  }
}

async function createLesson() {
  const name = document.getElementById('lesson-name').value.trim();
  const type = document.getElementById('lesson-type').value;
  const date = document.getElementById('lesson-date').value;
  const time = document.getElementById('lesson-time').value;
  const capacity = parseInt(document.getElementById('lesson-capacity').value);
  const price = parseFloat(document.getElementById('lesson-price').value);
  const teacherId = document.getElementById('lesson-teacher').value;

  if (!name || !type || !date || !time || !capacity || !price || !teacherId) {
    showToast('Lütfen tüm alanları doldurun');
    return;
  }

  const { error } = await supabase
    .from('lessons')
    .insert({
      name,
      type,
      date,
      time,
      capacity,
      price,
      teacher_id: teacherId
    });

  if (error) {
    showToast('Ders oluşturulamadı: ' + error.message);
    return;
  }

  // Reset form
  document.getElementById('form-lesson').reset();
  showToast('Ders oluşturuldu ✓');
  navigateTo('home');
}

// ============================================
// STUDENTS — Cache & Autocomplete
// ============================================

async function loadStudentCache() {
  const { data } = await supabase
    .from('students')
    .select('id, name, phone')
    .order('name');

  studentCache = data || [];
}

// Student name autocomplete
const studentNameInput = document.getElementById('student-name');
const suggestionsDiv = document.getElementById('student-suggestions');
let selectedStudentId = null;

if (studentNameInput) {
  studentNameInput.addEventListener('input', () => {
    const query = studentNameInput.value.trim().toLowerCase();
    selectedStudentId = null;

    if (query.length < 2) {
      suggestionsDiv.classList.add('hidden');
      return;
    }

    const matches = studentCache.filter(s =>
      s.name.toLowerCase().includes(query)
    ).slice(0, 5);

    if (!matches.length) {
      suggestionsDiv.classList.add('hidden');
      return;
    }

    suggestionsDiv.innerHTML = matches.map(s => `
      <div class="suggestion-item" onclick="selectStudent('${s.id}', '${escAttr(s.name)}', '${escAttr(s.phone || '')}')">
        ${escHtml(s.name)}
        ${s.phone ? `<span class="suggestion-phone">${escHtml(s.phone)}</span>` : ''}
      </div>
    `).join('');

    suggestionsDiv.classList.remove('hidden');
  });

  // Hide suggestions on blur (with delay for click)
  studentNameInput.addEventListener('blur', () => {
    setTimeout(() => suggestionsDiv.classList.add('hidden'), 200);
  });
}

function selectStudent(id, name, phone) {
  selectedStudentId = id;
  document.getElementById('student-name').value = name;
  document.getElementById('student-phone').value = phone;
  suggestionsDiv.classList.add('hidden');
}

// ============================================
// STUDENTS — Enroll
// ============================================

async function loadLessonDropdown() {
  const select = document.getElementById('enroll-lesson');

  const { data, error } = await supabase
    .from('lessons')
    .select('id, name, date, time')
    .order('date', { ascending: true });

  if (error) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">Ders seçiniz...</option>';

  data.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = `${l.name} — ${formatDate(l.date)} ${l.time || ''}`;
    select.appendChild(opt);
  });

  if (currentVal) select.value = currentVal;
}

function selectPayment(btn) {
  document.querySelectorAll('#page-add-student .payment-chip')
    .forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  selectedPaymentStatus = btn.dataset.status;
}

async function enrollStudent() {
  const name = document.getElementById('student-name').value.trim();
  const phone = document.getElementById('student-phone').value.trim();
  const lessonId = document.getElementById('enroll-lesson').value;
  const paidAmount = parseFloat(document.getElementById('paid-amount').value) || 0;
  const note = document.getElementById('enroll-note').value.trim();

  if (!name || !lessonId) {
    showToast('Ad ve ders alanları zorunludur');
    return;
  }

  let studentId = selectedStudentId;

  // If no existing student selected, find or create
  if (!studentId) {
    // Check if student exists by name
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .ilike('name', name)
      .limit(1)
      .single();

    if (existing) {
      studentId = existing.id;
    } else {
      // Create new student
      const { data: newStudent, error: studentErr } = await supabase
        .from('students')
        .insert({ name, phone: phone || null })
        .select()
        .single();

      if (studentErr) {
        showToast('Öğrenci eklenemedi: ' + studentErr.message);
        return;
      }
      studentId = newStudent.id;
    }
  } else {
    // Update phone if changed
    if (phone) {
      await supabase
        .from('students')
        .update({ phone })
        .eq('id', studentId);
    }
  }

  // Create enrollment
  const { error: enrollErr } = await supabase
    .from('enrollments')
    .insert({
      lesson_id: lessonId,
      student_id: studentId,
      payment_status: selectedPaymentStatus,
      paid_amount: paidAmount,
      note: note || null
    });

  if (enrollErr) {
    if (enrollErr.code === '23505') {
      showToast('Bu öğrenci zaten bu derse kayıtlı');
    } else {
      showToast('Kayıt oluşturulamadı: ' + enrollErr.message);
    }
    return;
  }

  // Reset form
  document.getElementById('form-student').reset();
  selectedStudentId = null;
  selectedPaymentStatus = 'paid';
  document.querySelectorAll('#page-add-student .payment-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('#page-add-student .payment-chip[data-status="paid"]').classList.add('active');

  showToast('Öğrenci kaydedildi ✓');
  loadStudentCache();
}

// ============================================
// LESSON DETAIL
// ============================================

async function openLessonDetail(lessonId) {
  currentLessonId = lessonId;

  // Fetch lesson
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('*, teachers ( name )')
    .eq('id', lessonId)
    .single();

  if (lessonErr || !lesson) {
    showToast('Ders bulunamadı');
    return;
  }

  // Set header
  document.getElementById('detail-title').textContent = lesson.name;
  document.getElementById('detail-subtitle').textContent =
    `${formatDate(lesson.date)} ${lesson.time} · ${lesson.teachers?.name || '—'} · ${lesson.price}₺`;

  // Fetch enrollments with student info
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, students ( id, name, phone )')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true });

  const enrolled = enrollments || [];

  // Summary
  const totalExpected = enrolled.length * lesson.price;
  const totalPaid = enrolled.reduce((sum, e) => sum + (e.paid_amount || 0), 0);
  const remaining = totalExpected - totalPaid;

  document.getElementById('detail-summary').innerHTML = `
    <div class="summary-card">
      <div class="label">Tahsilat</div>
      <div class="value success">${formatMoney(totalPaid)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Beklenen</div>
      <div class="value">${formatMoney(totalExpected)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Kalan</div>
      <div class="value ${remaining > 0 ? 'warning' : 'success'}">${formatMoney(remaining)}</div>
    </div>
  `;

  // Student list
  const studentList = document.getElementById('detail-students');
  const detailEmpty = document.getElementById('detail-empty');

  if (!enrolled.length) {
    studentList.innerHTML = '';
    detailEmpty.classList.remove('hidden');
  } else {
    detailEmpty.classList.add('hidden');
    studentList.innerHTML = enrolled.map(e => {
      const student = e.students;
      const initials = getInitials(student.name);
      const statusLabel = {
        paid: 'Ödendi',
        pending: 'Bekliyor',
        partial: 'Kısmi'
      }[e.payment_status] || e.payment_status;

      return `
        <div class="student-row" onclick="openEditModal('${e.id}', '${escAttr(student.name)}', '${e.payment_status}', ${e.paid_amount || 0}, '${escAttr(e.note || '')}')">
          <div class="student-avatar">${initials}</div>
          <div class="student-info">
            <div class="student-name">${escHtml(student.name)}</div>
            ${e.note ? `<div class="student-note">${escHtml(e.note)}</div>` : ''}
          </div>
          <div class="student-payment">
            <div class="student-amount">${formatMoney(e.paid_amount || 0)}</div>
            <div class="student-status ${e.payment_status}">${statusLabel}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Show page
  navigateToPage('lesson-detail');
}

function navigateToPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  window.scrollTo(0, 0);
}

function addStudentToCurrentLesson() {
  navigateTo('add-student');
  // Pre-select the current lesson after dropdown loads
  setTimeout(() => {
    const select = document.getElementById('enroll-lesson');
    if (select && currentLessonId) {
      select.value = currentLessonId;
    }
  }, 500);
}

async function deleteCurrentLesson() {
  if (!confirm('Bu dersi silmek istediğinize emin misiniz? Tüm kayıtlar da silinecek.')) return;

  // Delete enrollments first
  await supabase
    .from('enrollments')
    .delete()
    .eq('lesson_id', currentLessonId);

  // Delete lesson
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', currentLessonId);

  if (error) {
    showToast('Silinemedi: ' + error.message);
    return;
  }

  showToast('Ders silindi');
  currentLessonId = null;
  navigateTo('home');
}

// ============================================
// EDIT ENROLLMENT MODAL
// ============================================

function openEditModal(enrollmentId, studentName, status, amount, note) {
  editingEnrollmentId = enrollmentId;
  document.getElementById('edit-modal-title').textContent = studentName;
  document.getElementById('edit-paid-amount').value = amount;
  document.getElementById('edit-note').value = note;

  // Set payment status chip
  document.querySelectorAll('#edit-modal .payment-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.status === status);
  });

  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingEnrollmentId = null;
}

function selectEditPayment(btn) {
  document.querySelectorAll('#edit-modal .payment-chip')
    .forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

async function saveEnrollmentEdit() {
  const activeChip = document.querySelector('#edit-modal .payment-chip.active');
  const paymentStatus = activeChip ? activeChip.dataset.status : 'pending';
  const paidAmount = parseFloat(document.getElementById('edit-paid-amount').value) || 0;
  const note = document.getElementById('edit-note').value.trim();

  const { error } = await supabase
    .from('enrollments')
    .update({
      payment_status: paymentStatus,
      paid_amount: paidAmount,
      note: note || null
    })
    .eq('id', editingEnrollmentId);

  if (error) {
    showToast('Güncellenemedi: ' + error.message);
    return;
  }

  closeEditModal();
  showToast('Güncellendi ✓');
  openLessonDetail(currentLessonId);
}

async function removeEnrollment() {
  if (!confirm('Bu öğrenci kaydını silmek istediğinize emin misiniz?')) return;

  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', editingEnrollmentId);

  if (error) {
    showToast('Silinemedi: ' + error.message);
    return;
  }

  closeEditModal();
  showToast('Kayıt silindi');
  openLessonDetail(currentLessonId);
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${d.getDate()} ${months[d.getMonth()]} ${days[d.getDay()]}`;
}

function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMoney(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getInitials(name) {
  return name.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  navigateTo('home');
});
