import { getConcepts, getLessons, getMapPins } from './storage.js'
import { shuffle, escapeHtml } from './utils.js'
import { TURKEY_SVG, PROVINCES } from './turkeyMapData.js'

const REQUIRED_CHOICES = 5
const QUESTION_COUNT_OPTIONS = [10, 20, 50, 100, 'all']
const HINT_COUNT_OPTIONS = [1, 2, 3, 4, 5]
const DEFAULT_HINT_COUNT = 2
const MAP_QUESTION_COUNT_OPTIONS = [10, 20, 50, 'all']

export function renderQuizView(container) {
  showStart()

  async function showStart() {
    container.innerHTML = `<p class="empty-state">Yükleniyor…</p>`
    let allConcepts = []
    let lessons = []
    let mapPins = []
    try {
      ;[allConcepts, lessons, mapPins] = await Promise.all([getConcepts(), getLessons(), getMapPins()])
    } catch (err) {
      container.innerHTML = `<p class="empty-state">Test verileri yüklenemedi. Lütfen tekrar deneyin.</p>`
      return
    }

    const lessonStats = lessons.map((l) => ({
      ...l,
      count: allConcepts.filter((c) => c.lessonId === l.id).length,
    }))
    const unassignedCount = allConcepts.filter((c) => !c.lessonId).length

    container.innerHTML = `
      <section class="panel quiz-start">
        <h2>Test Ayarları</h2>
        <p class="quiz-intro-text">Test türünü, dersleri ve soru sayısını seç.</p>

        <div class="quiz-settings">
          <div class="quiz-setting-group">
            <h3 class="quiz-section-title">Test Türü</h3>
            <div class="quiz-type-grid">
              <label class="quiz-type-item">
                <input type="radio" name="test-type" value="concept" checked />
                <span class="quiz-type-icon">📝</span>
                <span class="quiz-type-label">Kavram Testi</span>
                <span class="quiz-type-desc">Bilgilerden kavramı bul</span>
              </label>
              <label class="quiz-type-item">
                <input type="radio" name="test-type" value="map" ${mapPins.length < 2 ? 'disabled' : ''} />
                <span class="quiz-type-icon">🗺️</span>
                <span class="quiz-type-label">Harita Testi</span>
                <span class="quiz-type-desc">${mapPins.length < 2 ? 'En az 2 pin gerekli' : 'Pinlerden kavramı bul / kavramın pinini seç'}</span>
              </label>
            </div>
          </div>

          <div class="quiz-concept-settings" id="concept-settings">
            <div class="quiz-setting-group">
              <h3 class="quiz-section-title">Ders Seçimi</h3>
              <label class="quiz-check-item quiz-check-all">
                <input type="checkbox" id="select-all-lessons" checked />
                <span class="quiz-check-label">Tüm Dersler</span>
                <span class="quiz-check-count">${allConcepts.length} kavram</span>
              </label>
              ${
                lessonStats.length > 0
                  ? `<div class="quiz-lesson-grid">
                      ${lessonStats
                        .map(
                          (l) => `
                        <label class="quiz-check-item">
                          <input type="checkbox" class="lesson-check" data-lesson-id="${l.id}" checked />
                          <span class="quiz-check-label">${escapeHtml(l.name)}</span>
                          <span class="quiz-check-count">${l.count} kavram</span>
                        </label>
                      `
                        )
                        .join('')}
                    </div>`
                  : ''
              }
              ${
                unassignedCount > 0
                  ? `<label class="quiz-check-item">
                      <input type="checkbox" id="unassigned-check" checked />
                      <span class="quiz-check-label">Derssiz Kavramlar</span>
                      <span class="quiz-check-count">${unassignedCount} kavram</span>
                    </label>`
                  : ''
              }
            </div>

            <div class="quiz-setting-group">
              <h3 class="quiz-section-title">Soru Sayısı</h3>
              <div class="quiz-count-grid">
                ${QUESTION_COUNT_OPTIONS.map(
                  (opt) => `
                  <label class="quiz-count-item">
                    <input type="radio" name="question-count" value="${opt}" ${opt === 'all' ? 'checked' : ''} />
                    <span>${opt === 'all' ? 'Tümü' : opt}</span>
                  </label>
                `
                ).join('')}
              </div>
            </div>

            <div class="quiz-setting-group">
              <h3 class="quiz-section-title">Testte Gösterilecek İpucu/Girdi Sayısı</h3>
              <div class="quiz-count-grid">
                ${HINT_COUNT_OPTIONS.map(
                  (opt) => `
                  <label class="quiz-count-item">
                    <input type="radio" name="hint-count" value="${opt}" ${opt === DEFAULT_HINT_COUNT ? 'checked' : ''} />
                    <span>${opt}</span>
                  </label>
                `
                ).join('')}
              </div>
              <p class="form-hint">Bir kavramda bu sayıdan az bilgi varsa, mevcut tüm bilgiler gösterilir.</p>
            </div>
          </div>

          <div class="quiz-map-settings" id="map-settings" style="display: none;">
            <div class="quiz-setting-group">
              <h3 class="quiz-section-title">Harita Testi Modu</h3>
              <div class="quiz-type-grid">
                <label class="quiz-type-item">
                  <input type="radio" name="map-test-mode" value="find-concept" checked />
                  <span class="quiz-type-icon">📍</span>
                  <span class="quiz-type-label">Ortak Kavramı Bul</span>
                  <span class="quiz-type-desc">Haritadaki tüm pinleri gör, ortak kavramı seç</span>
                </label>
                <label class="quiz-type-item">
                  <input type="radio" name="map-test-mode" value="find-pin" />
                  <span class="quiz-type-icon">🎯</span>
                  <span class="quiz-type-label">Kavramın Pinini Seç</span>
                  <span class="quiz-type-desc">Verilen kavramın haritadaki pin grubuna tıkla</span>
                </label>
              </div>
            </div>

            <div class="quiz-setting-group">
              <h3 class="quiz-section-title">Soru Sayısı</h3>
              <div class="quiz-count-grid">
                ${MAP_QUESTION_COUNT_OPTIONS.map(
                  (opt) => `
                  <label class="quiz-count-item">
                    <input type="radio" name="map-question-count" value="${opt}" ${opt === 'all' ? 'checked' : ''} />
                    <span>${opt === 'all' ? 'Tümü' : opt}</span>
                  </label>
                `
                ).join('')}
              </div>
            </div>

            <div class="quiz-setting-group">
              <h3 class="quiz-section-title">Testte Gösterilecek İpucu/Girdi Sayısı</h3>
              <div class="quiz-count-grid">
                ${HINT_COUNT_OPTIONS.map(
                  (opt) => `
                  <label class="quiz-count-item">
                    <input type="radio" name="map-hint-count" value="${opt}" ${opt === DEFAULT_HINT_COUNT ? 'checked' : ''} />
                    <span>${opt}</span>
                  </label>
                `
                ).join('')}
              </div>
              <p class="form-hint">Bir kavramda bu sayıdan az bilgi varsa, mevcut tüm bilgiler gösterilir.</p>
            </div>
          </div>
        </div>

        <div class="quiz-start-summary">
          <span id="selected-summary">Seçili: ${allConcepts.length} kavram</span>
        </div>

        <div class="form-actions form-actions-right">
          <button id="start-quiz-btn" class="btn btn-primary">Testi Başlat</button>
        </div>
      </section>
    `

    bindSettingsEvents(allConcepts, lessons, lessonStats, unassignedCount, mapPins)
  }

  function bindSettingsEvents(allConcepts, lessons, lessonStats, unassignedCount, mapPins) {
    const conceptSettings = container.querySelector('#concept-settings')
    const mapSettings = container.querySelector('#map-settings')
    const summary = container.querySelector('#selected-summary')
    const startBtn = container.querySelector('#start-quiz-btn')

    function updateView() {
      const testType = container.querySelector('input[name="test-type"]:checked')?.value
      if (testType === 'map') {
        conceptSettings.style.display = 'none'
        mapSettings.style.display = ''
        summary.textContent = `Seçili: ${mapPins.length} kavram`
        startBtn.disabled = mapPins.length < 2
      } else {
        conceptSettings.style.display = ''
        mapSettings.style.display = 'none'
        updateConceptSummary()
      }
    }

    function updateConceptSummary() {
      const selectAll = container.querySelector('#select-all-lessons')
      const lessonChecks = container.querySelectorAll('.lesson-check')
      const unassignedCheck = container.querySelector('#unassigned-check')
      const includeAll = selectAll ? selectAll.checked : false
      const selectedLessonIds = Array.from(lessonChecks)
        .filter((c) => c.checked)
        .map((c) => c.dataset.lessonId)
      const includeUnassigned = unassignedCheck ? unassignedCheck.checked : false

      let count
      if (includeAll) {
        count = allConcepts.length
      } else {
        count = allConcepts.filter(
          (c) => selectedLessonIds.includes(c.lessonId) || (includeUnassigned && !c.lessonId)
        ).length
      }
      summary.textContent = `Seçili: ${count} kavram`
      startBtn.disabled = count < 2
    }

    container.querySelectorAll('input[name="test-type"]').forEach((radio) => {
      radio.addEventListener('change', updateView)
    })

    const selectAll = container.querySelector('#select-all-lessons')
    const lessonChecks = container.querySelectorAll('.lesson-check')
    const unassignedCheck = container.querySelector('#unassigned-check')

    function setAllLessonChecks(checked) {
      lessonChecks.forEach((c) => (c.checked = checked))
      if (unassignedCheck) unassignedCheck.checked = checked
    }

    if (selectAll) {
      selectAll.addEventListener('change', () => {
        setAllLessonChecks(selectAll.checked)
        updateConceptSummary()
      })
    }

    lessonChecks.forEach((check) => {
      check.addEventListener('change', () => {
        const allLessonsChecked =
          Array.from(lessonChecks).every((c) => c.checked) && (!unassignedCheck || unassignedCheck.checked)
        if (selectAll) selectAll.checked = allLessonsChecked
        updateConceptSummary()
      })
    })

    if (unassignedCheck) {
      unassignedCheck.addEventListener('change', () => {
        const allLessonsChecked = Array.from(lessonChecks).every((c) => c.checked) && unassignedCheck.checked
        if (selectAll) selectAll.checked = allLessonsChecked
        updateConceptSummary()
      })
    }

    startBtn.addEventListener('click', () => {
      const testType = container.querySelector('input[name="test-type"]:checked')?.value
      if (testType === 'map') {
        const mapMode = container.querySelector('input[name="map-test-mode"]:checked').value
        const countValue = container.querySelector('input[name="map-question-count"]:checked').value
        const requestedCount = countValue === 'all' ? null : parseInt(countValue, 10)
        const hintCount = parseInt(container.querySelector('input[name="map-hint-count"]:checked').value, 10)
        startMapQuiz(mapPins, mapMode, requestedCount, hintCount)
      } else {
        const includeAll = selectAll ? selectAll.checked : false
        const selectedLessonIds = Array.from(lessonChecks)
          .filter((c) => c.checked)
          .map((c) => c.dataset.lessonId)
        const includeUnassigned = unassignedCheck ? unassignedCheck.checked : false

        let conceptsToTest
        if (includeAll) {
          conceptsToTest = allConcepts
        } else {
          conceptsToTest = allConcepts.filter(
            (c) => selectedLessonIds.includes(c.lessonId) || (includeUnassigned && !c.lessonId)
          )
        }

        const countValue = container.querySelector('input[name="question-count"]:checked').value
        const requestedCount = countValue === 'all' ? null : parseInt(countValue, 10)
        const hintCount = parseInt(container.querySelector('input[name="hint-count"]:checked').value, 10)
        startQuiz(conceptsToTest, allConcepts, requestedCount, hintCount)
      }
    })

    updateView()
  }

  function startQuiz(conceptsToTest, allConcepts, requestedCount, hintCount) {
    const shuffledConcepts = shuffle(conceptsToTest)
    const questions = requestedCount ? shuffledConcepts.slice(0, requestedCount) : shuffledConcepts
    const order = questions.map((c) => c.id)
    showQuestion({ allConcepts, conceptsToTest: questions, order, index: 0, score: 0, answers: [], hintCount })
  }

  function buildChoices(allConcepts, concept) {
    const pool = allConcepts.filter((c) => c.lessonId === concept.lessonId)
    const others = pool.filter((c) => c.id !== concept.id)
    const selected = shuffle(others).slice(0, REQUIRED_CHOICES - 1)
    const choices = [concept, ...selected]

    while (choices.length < REQUIRED_CHOICES) {
      if (others.length > 0) {
        choices.push(shuffle(others)[0])
      } else {
        choices.push(concept)
      }
    }

    return shuffle(choices.slice(0, REQUIRED_CHOICES))
  }

  function showConfirmModal({ title, message, confirmText, cancelText, onConfirm }) {
    const existing = document.querySelector('#confirm-modal-overlay')
    if (existing) existing.remove()

    const overlay = document.createElement('div')
    overlay.id = 'confirm-modal-overlay'
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <h3 class="modal-title">${escapeHtml(title)}</h3>
        <p class="modal-message">${escapeHtml(message)}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="modal-cancel">${escapeHtml(cancelText)}</button>
          <button type="button" class="btn btn-primary" id="modal-confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    function closeModal() {
      overlay.remove()
    }

    overlay.querySelector('#modal-cancel').addEventListener('click', closeModal)
    overlay.querySelector('#modal-confirm').addEventListener('click', () => {
      closeModal()
      onConfirm()
    })
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal()
    })
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        closeModal()
        document.removeEventListener('keydown', onEsc)
      }
    })
  }

  function showQuestion(state) {
    const { allConcepts, conceptsToTest, order, index, score, answers, hintCount } = state
    const concept = conceptsToTest.find((c) => c.id === order[index])
    if (!concept) return
    const selectedFacts = shuffle([...concept.facts]).slice(0, hintCount)
    const choices = buildChoices(allConcepts, concept)
    let answered = false

    container.innerHTML = `
      <div class="quiz-bar">
        <span class="quiz-bar-progress">${index + 1} / ${order.length}</span>
        <button id="finish-quiz-btn" class="btn btn-danger-ghost">Testi Bitir</button>
      </div>
      <section class="panel quiz-question">
        <div class="quiz-progress">
          <div class="progress-track">
            <div class="progress-fill" style="width: ${(index / order.length) * 100}%"></div>
          </div>
          <span class="progress-label">${index + 1} / ${order.length}</span>
        </div>
        <p class="quiz-score">Skor: ${score}</p>
        <div class="question-card">
          <span class="question-tag">Bilgi</span>
          <div class="question-facts">
            ${selectedFacts.map((f) => `<p class="fact-item">${escapeHtml(f)}</p>`).join('')}
          </div>
        </div>
        <p class="question-prompt">Verilen bilgiler aşağıdakilerden hangisi ile eşleştirilebilir?</p>
        <div class="choices-grid">
          ${choices.map((c) => `<button class="choice-btn" data-id="${c.id}">${escapeHtml(c.title)}</button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback"></div>
      </section>
    `

    const finishBtn = container.querySelector('#finish-quiz-btn')
    finishBtn.addEventListener('click', () => {
      const remaining = order.length - answers.length
      showConfirmModal({
        title: 'Testi Bitirmek İstediğinize Emin Misiniz?',
        message: `Çözülmemiş ${remaining} soru boş sayılacak ve test sonlandırılacak. Bu işlem geri alınamaz.`,
        confirmText: 'Tamam',
        cancelText: 'Vazgeç',
        onConfirm: () => showResults({ order, score, answers, conceptsToTest, allConcepts }),
      })
    })

    container.querySelectorAll('.choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return
        answered = true
        const isCorrect = btn.dataset.id === concept.id
        const newScore = isCorrect ? score + 1 : score
        const answerRecord = {
          questionNumber: index + 1,
          facts: selectedFacts,
          correctId: concept.id,
          correctTitle: concept.title,
          selectedId: btn.dataset.id,
          selectedTitle: choices.find((c) => c.id === btn.dataset.id)?.title || '',
          isCorrect,
        }

        container.querySelectorAll('.choice-btn').forEach((b) => {
          b.disabled = true
          if (b.dataset.id === concept.id) b.classList.add('choice-correct')
          else if (b === btn && !isCorrect) b.classList.add('choice-wrong')
        })

        const feedback = container.querySelector('#quiz-feedback')
        feedback.innerHTML = `
          <p class="feedback-text ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}">
            ${isCorrect ? 'Doğru!' : `Yanlış. Doğru cevap: <strong>${escapeHtml(concept.title)}</strong>`}
          </p>
          <div class="feedback-actions">
            <button id="next-question-btn" class="btn btn-primary">
              ${index + 1 < order.length ? 'Sonraki Soru' : 'Sonuçları Gör'}
            </button>
          </div>
        `
        feedback.classList.add('feedback-visible')

        container.querySelector('#next-question-btn').addEventListener('click', () => {
          const newAnswers = [...answers, answerRecord]
          if (index + 1 < order.length) {
            showQuestion({ allConcepts, conceptsToTest, order, index: index + 1, score: newScore, answers: newAnswers, hintCount })
          } else {
            showResults({ order, score: newScore, answers: newAnswers, conceptsToTest, allConcepts })
          }
        })
      })
    })
  }

  function startMapQuiz(allPins, mapMode, requestedCount, hintCount) {
    const validPins = allPins.filter((p) => p.pins && p.pins.length > 0)
    const shuffledPins = shuffle(validPins)
    const questions = requestedCount ? shuffledPins.slice(0, requestedCount) : shuffledPins
    const order = questions.map((p) => p.id)
    showMapQuestion({
      allPins,
      pinsToTest: questions,
      order,
      index: 0,
      score: 0,
      answers: [],
      hintCount,
      mapMode,
    })
  }

  function showMapQuestion(state) {
    const { allPins, pinsToTest, order, index, score, answers, hintCount, mapMode } = state
    const pin = pinsToTest.find((p) => p.id === order[index])
    if (!pin) return
    const selectedFacts = shuffle([...pin.facts]).slice(0, hintCount)

    const questionHtml =
      mapMode === 'find-concept'
        ? renderFindConceptQuestion(pin, allPins, selectedFacts)
        : renderFindPinQuestion(pin, allPins, selectedFacts)

    container.innerHTML = `
      <div class="quiz-bar">
        <span class="quiz-bar-progress">${index + 1} / ${order.length}</span>
        <button id="finish-quiz-btn" class="btn btn-danger-ghost">Testi Bitir</button>
      </div>
      <section class="panel quiz-question quiz-map-question">
        <div class="quiz-progress">
          <div class="progress-track">
            <div class="progress-fill" style="width: ${(index / order.length) * 100}%"></div>
          </div>
          <span class="progress-label">${index + 1} / ${order.length}</span>
        </div>
        <p class="quiz-score">Skor: ${score}</p>
        ${questionHtml}
        <div class="quiz-feedback" id="quiz-feedback"></div>
      </section>
    `

    setupMapSvgInteractivity()

    const finishBtn = container.querySelector('#finish-quiz-btn')
    finishBtn.addEventListener('click', () => {
      const remaining = order.length - answers.length
      showConfirmModal({
        title: 'Testi Bitirmek İstediğinize Emin Misiniz?',
        message: `Çözülmemiş ${remaining} soru boş sayılacak ve test sonlandırılacak. Bu işlem geri alınamaz.`,
        confirmText: 'Tamam',
        cancelText: 'Vazgeç',
        onConfirm: () => showMapResults({ order, score, answers, pinsToTest, allPins, mapMode }),
      })
    })

    const answerState = { answered: false }

    if (mapMode === 'find-concept') {
      bindFindConceptChoices(pin, allPins, selectedFacts, state, answerState)
    } else {
      bindFindPinChoices(pin, allPins, selectedFacts, state, answerState)
    }
  }

  function setupMapSvgInteractivity() {
    container.querySelectorAll('.map-question-location svg, .map-quiz-interactive svg').forEach((svg) => {
      svg.style.width = '100%'
      svg.style.height = 'auto'
      svg.style.display = 'block'
    })
  }

  function renderFindConceptQuestion(pin, allPins, selectedFacts) {
    const choices = buildPinChoices(pin, allPins)
    const pinsHtml = pin.pins
      .map(
        (pp) =>
          `<div class="map-pin-highlight" style="left: ${pp.x}%; top: ${pp.y}%;">
            <span class="pin-dot pin-dot-highlight"></span>
            ${pin.showLabels && pp.label ? `<span class="pin-label">${escapeHtml(pp.label)}</span>` : ''}
          </div>`
      )
      .join('')
    return `
      <div class="question-card map-question-card">
        <span class="question-tag">Harita Pinleri</span>
        <div class="map-question-location">
          ${pinsHtml}
          ${TURKEY_SVG}
        </div>
      </div>
      <p class="question-prompt">İşaretli noktalardaki ortak kavram/maden aşağıdakilerden hangisidir?</p>
      <div class="choices-grid" id="find-concept-choices">
        ${choices.map((c) => `<button class="choice-btn" data-id="${c.id}">${escapeHtml(c.title)}</button>`).join('')}
      </div>
    `
  }

  function renderFindPinQuestion(pin, allPins, selectedFacts) {
    return `
      <div class="question-card">
        <span class="question-tag">Kavram</span>
        <div class="question-facts">
          <p class="fact-item fact-item-title">${escapeHtml(pin.title)}</p>
          ${selectedFacts.map((f) => `<p class="fact-item">${escapeHtml(f)}</p>`).join('')}
        </div>
      </div>
      <p class="question-prompt">Bu kavramın haritadaki pin grubuna tıkla. Hangi pin grubu bu kavrama ait?</p>
      <div class="map-quiz-interactive" id="map-quiz-interactive">
        ${TURKEY_SVG}
        <div class="map-pins-overlay" id="map-quiz-pins">
          ${allPins
            .map(
              (p) => {
                const groupPins = p.pins.map(
                  (pp) =>
                    `<span class="pin-dot pin-dot-quiz" style="left: ${pp.x}%; top: ${pp.y}%;"></span>`
                ).join('')
                return `<div class="map-pin-quiz-group" data-pin-id="${p.id}">${groupPins}</div>`
              }
            )
            .join('')}
        </div>
      </div>
    `
  }

  function buildPinChoices(pin, allPins) {
    const others = allPins.filter((p) => p.id !== pin.id)
    const selected = shuffle(others).slice(0, REQUIRED_CHOICES - 1)
    const choices = [pin, ...selected]
    while (choices.length < REQUIRED_CHOICES) {
      if (others.length > 0) {
        choices.push(shuffle(others)[0])
      } else {
        choices.push(pin)
      }
    }
    return shuffle(choices.slice(0, REQUIRED_CHOICES))
  }

  function bindFindConceptChoices(pin, allPins, selectedFacts, state, answerState) {
    container.querySelectorAll('#find-concept-choices .choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answerState.answered) return
        answerState.answered = true
        const isCorrect = btn.dataset.id === pin.id
        handleMapAnswer(pin, allPins, selectedFacts, isCorrect, btn, state, 'concept')
      })
    })
  }

  function bindFindPinChoices(pin, allPins, selectedFacts, state, answerState) {
    container.querySelectorAll('.map-pin-quiz-group').forEach((el) => {
      el.querySelectorAll('.pin-dot-quiz').forEach((dot) => {
        dot.style.pointerEvents = 'auto'
        dot.style.cursor = 'pointer'
      })
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        if (answerState.answered) return
        answerState.answered = true
        const selectedId = el.dataset.pinId
        const isCorrect = selectedId === pin.id
        const selectedPin = allPins.find((p) => p.id === selectedId)
        handleMapAnswer(pin, allPins, selectedFacts, isCorrect, el, state, 'pin', selectedPin)
      })
    })
  }

  function handleMapAnswer(pin, allPins, selectedFacts, isCorrect, clickedEl, state, answerType, selectedPin) {
    const { order, index, score, answers, pinsToTest, hintCount, mapMode } = state
    const newScore = isCorrect ? score + 1 : score

    if (answerType === 'concept') {
      container.querySelectorAll('#find-concept-choices .choice-btn').forEach((b) => {
        b.disabled = true
        if (b.dataset.id === pin.id) b.classList.add('choice-correct')
        else if (b === clickedEl && !isCorrect) b.classList.add('choice-wrong')
      })
    } else {
      container.querySelectorAll('.map-pin-quiz-group').forEach((el) => {
        el.querySelectorAll('.pin-dot-quiz').forEach((dot) => {
          dot.style.pointerEvents = 'none'
          if (el.dataset.pinId === pin.id) dot.classList.add('pin-dot-correct')
          else if (el === clickedEl && !isCorrect) dot.classList.add('pin-dot-wrong')
        })
      })
    }

    const answerRecord = {
      questionNumber: index + 1,
      facts: selectedFacts,
      correctId: pin.id,
      correctTitle: pin.title,
      correctPin: pin,
      selectedId: answerType === 'concept' ? clickedEl.dataset.id : selectedPin?.id,
      selectedTitle: answerType === 'concept' ? clickedEl.textContent : selectedPin?.title || '',
      isCorrect,
      mapMode,
    }

    const feedback = container.querySelector('#quiz-feedback')
    feedback.innerHTML = `
      <p class="feedback-text ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}">
        ${isCorrect ? 'Doğru!' : `Yanlış. Doğru cevap: <strong>${escapeHtml(pin.title)}</strong>`}
      </p>
      <div class="feedback-actions">
        <button id="next-question-btn" class="btn btn-primary">
          ${index + 1 < order.length ? 'Sonraki Soru' : 'Sonuçları Gör'}
        </button>
      </div>
    `
    feedback.classList.add('feedback-visible')

    container.querySelector('#next-question-btn').addEventListener('click', () => {
      const newAnswers = [...answers, answerRecord]
      if (index + 1 < order.length) {
        showMapQuestion({
          allPins,
          pinsToTest,
          order,
          index: index + 1,
          score: newScore,
          answers: newAnswers,
          hintCount,
          mapMode,
        })
      } else {
        showMapResults({ order, score: newScore, answers: newAnswers, pinsToTest, allPins, mapMode })
      }
    })
  }

  function showMapResults({ order, score, answers, pinsToTest, allPins, mapMode }) {
    const total = order.length
    const correct = answers.filter((a) => a.isCorrect).length
    const wrong = answers.filter((a) => !a.isCorrect).length
    const blank = total - answers.length
    const percent = total > 0 ? Math.round((score / total) * 100) : 0
    const wrongAnswers = answers.filter((a) => !a.isCorrect)

    container.innerHTML = `
      <section class="panel quiz-results">
        <h2>Harita Testi Bitti!</h2>
        <div class="result-circle">
          <span class="result-percent">%${percent}</span>
        </div>
        <p class="result-score">${correct} / ${total} doğru</p>
        <div class="result-summary-grid">
          <div class="result-stat result-stat-correct">
            <span class="result-stat-value">${correct}</span>
            <span class="result-stat-label">Doğru</span>
          </div>
          <div class="result-stat result-stat-wrong">
            <span class="result-stat-value">${wrong}</span>
            <span class="result-stat-label">Yanlış</span>
          </div>
          <div class="result-stat result-stat-blank">
            <span class="result-stat-value">${blank}</span>
            <span class="result-stat-label">Boş</span>
          </div>
        </div>
        <div class="results-actions">
          <button id="home-btn" class="btn btn-ghost">Ana Sayfaya Dön</button>
          <button id="review-btn" class="btn btn-primary" ${wrongAnswers.length === 0 ? 'disabled' : ''}>
            ${wrongAnswers.length === 0 ? 'Yanlış Yok' : `Yanlışlarımı İncele (${wrongAnswers.length})`}
          </button>
        </div>
      </section>
    `

    container.querySelector('#home-btn').addEventListener('click', () => showStart())
    const reviewBtn = container.querySelector('#review-btn')
    if (reviewBtn && wrongAnswers.length > 0) {
      reviewBtn.addEventListener('click', () => showMapReview(wrongAnswers, { pinsToTest, allPins, mapMode }))
    }
  }

  function showMapReview(wrongAnswers, { pinsToTest, allPins, mapMode }) {
    container.innerHTML = `
      <section class="panel quiz-review">
        <div class="review-header">
          <h2>Yanlışlarımı İncele</h2>
          <button id="back-home-btn" class="btn btn-ghost">Ana Sayfaya Dön</button>
        </div>
        <div class="review-list">
          ${wrongAnswers
            .map((a) => {
              const pin = a.correctPin
              const pinsHtml = pin.pins
                .map(
                  (pp) =>
                    `<div class="map-pin-highlight" style="left: ${pp.x}%; top: ${pp.y}%;">
                      <span class="pin-dot pin-dot-highlight"></span>
                      ${pin.showLabels && pp.label ? `<span class="pin-label">${escapeHtml(pp.label)}</span>` : ''}
                    </div>`
                )
                .join('')
              return `
                <article class="review-card map-review-card">
                  <span class="review-number">Soru ${a.questionNumber}</span>
                  <div class="map-review-location">
                    ${pinsHtml}
                    ${TURKEY_SVG}
                  </div>
                  <div class="review-choices">
                    <div class="review-choice review-choice-wrong">
                      <span class="review-choice-label">Senin işaretlediğin</span>
                      <span class="review-choice-title">${escapeHtml(a.selectedTitle)}</span>
                    </div>
                    <div class="review-choice review-choice-correct">
                      <span class="review-choice-label">Doğru cevap</span>
                      <span class="review-choice-title">${escapeHtml(a.correctTitle)}</span>
                    </div>
                  </div>
                </article>
              `
            })
            .join('')}
        </div>
        <div class="results-actions review-footer">
          <button id="retry-btn" class="btn btn-primary">Tekrar Dene</button>
          <button id="home-btn-2" class="btn btn-ghost">Ana Sayfaya Dön</button>
        </div>
      </section>
    `

    container.querySelectorAll('.map-review-location svg').forEach((svg) => {
      svg.style.width = '100%'
      svg.style.height = 'auto'
      svg.style.display = 'block'
    })

    container.querySelector('#back-home-btn').addEventListener('click', () => showStart())
    container.querySelector('#retry-btn').addEventListener('click', () => startMapQuiz(allPins, mapMode, null, DEFAULT_HINT_COUNT))
    container.querySelector('#home-btn-2').addEventListener('click', () => showStart())
  }

  function showResults({ order, score, answers, conceptsToTest, allConcepts }) {
    const total = order.length
    const correct = answers.filter((a) => a.isCorrect).length
    const wrong = answers.filter((a) => !a.isCorrect).length
    const blank = total - answers.length
    const percent = total > 0 ? Math.round((score / total) * 100) : 0
    const wrongAnswers = answers.filter((a) => !a.isCorrect)

    container.innerHTML = `
      <section class="panel quiz-results">
        <h2>Test Bitti!</h2>
        <div class="result-circle">
          <span class="result-percent">%${percent}</span>
        </div>
        <p class="result-score">${correct} / ${total} doğru</p>
        <div class="result-summary-grid">
          <div class="result-stat result-stat-correct">
            <span class="result-stat-value">${correct}</span>
            <span class="result-stat-label">Doğru</span>
          </div>
          <div class="result-stat result-stat-wrong">
            <span class="result-stat-value">${wrong}</span>
            <span class="result-stat-label">Yanlış</span>
          </div>
          <div class="result-stat result-stat-blank">
            <span class="result-stat-value">${blank}</span>
            <span class="result-stat-label">Boş</span>
          </div>
        </div>
        <div class="results-actions">
          <button id="home-btn" class="btn btn-ghost">Ana Sayfaya Dön</button>
          <button id="review-btn" class="btn btn-primary" ${wrongAnswers.length === 0 ? 'disabled' : ''}>
            ${wrongAnswers.length === 0 ? 'Yanlış Yok' : `Yanlışlarımı İncele (${wrongAnswers.length})`}
          </button>
        </div>
      </section>
    `

    container.querySelector('#home-btn').addEventListener('click', () => showStart())
    const reviewBtn = container.querySelector('#review-btn')
    if (reviewBtn && wrongAnswers.length > 0) {
      reviewBtn.addEventListener('click', () => showReview(wrongAnswers, { conceptsToTest, allConcepts }))
    }
  }

  function showReview(wrongAnswers, { conceptsToTest, allConcepts }) {
    container.innerHTML = `
      <section class="panel quiz-review">
        <div class="review-header">
          <h2>Yanlışlarımı İncele</h2>
          <button id="back-home-btn" class="btn btn-ghost">Ana Sayfaya Dön</button>
        </div>
        <div class="review-list">
          ${wrongAnswers
            .map(
              (a) => `
            <article class="review-card">
              <span class="review-number">Soru ${a.questionNumber}</span>
              <div class="question-facts review-facts">
                ${a.facts.map((f) => `<p class="fact-item">${escapeHtml(f)}</p>`).join('')}
              </div>
              <div class="review-choices">
                <div class="review-choice review-choice-wrong">
                  <span class="review-choice-label">Senin işaretlediğin</span>
                  <span class="review-choice-title">${escapeHtml(a.selectedTitle)}</span>
                </div>
                <div class="review-choice review-choice-correct">
                  <span class="review-choice-label">Doğru cevap</span>
                  <span class="review-choice-title">${escapeHtml(a.correctTitle)}</span>
                </div>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
        <div class="results-actions review-footer">
          <button id="retry-btn" class="btn btn-primary">Tekrar Dene</button>
          <button id="home-btn-2" class="btn btn-ghost">Ana Sayfaya Dön</button>
        </div>
      </section>
    `

    container.querySelector('#back-home-btn').addEventListener('click', () => showStart())
    container.querySelector('#retry-btn').addEventListener('click', () => startQuiz(conceptsToTest, allConcepts, null, DEFAULT_HINT_COUNT))
    container.querySelector('#home-btn-2').addEventListener('click', () => showStart())
  }
}
