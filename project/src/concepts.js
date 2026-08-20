import { getConcepts, addConcept, updateConcept, deleteConcept, getLessons } from './storage.js'
import { escapeHtml } from './utils.js'

const MIN_FACTS = 1
const DEFAULT_FACTS = 4

export function renderConceptsView(container) {
  let editingId = null

  async function render() {
    container.innerHTML = `<p class="empty-state">Yükleniyor…</p>`
    let concepts = []
    let lessons = []
    try {
      ;[concepts, lessons] = await Promise.all([getConcepts(), getLessons()])
    } catch (err) {
      container.innerHTML = `<p class="empty-state">Kavramlar yüklenemedi. Lütfen tekrar deneyin.</p>`
      return
    }

    const editingConcept = editingId ? concepts.find((c) => c.id === editingId) : null
    const initialFactCount = editingConcept
      ? Math.max(DEFAULT_FACTS, editingConcept.facts.length)
      : DEFAULT_FACTS

    container.innerHTML = `
      <section class="panel form-panel">
        <h2>${editingId ? 'Kavramı Düzenle' : 'Yeni Kavram Ekle'}</h2>
        <form id="concept-form" class="concept-form" novalidate>
          <label class="field">
            <span>Ders</span>
            <select id="concept-lesson" class="field-select">
              <option value="">-- Ders Seç (opsiyonel) --</option>
              ${lessons.map((l) => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('')}
            </select>
          </label>
          <label class="field">
            <span>Kavram Adı</span>
            <input type="text" id="concept-title" placeholder="Örn: Fotosentez" maxlength="80" />
          </label>
          <div class="facts-fields" id="facts-fields">
            ${Array.from({ length: initialFactCount })
              .map((_, i) => createFactFieldHtml(i))
              .join('')}
          </div>
          <p class="form-hint">En az 1 bilgi girmelisin. İstediğin kadar alan ekleyebilirsin.</p>
          <button type="button" id="add-fact-btn" class="btn btn-ghost add-fact-btn">+ Ek Bilgi Ekle</button>
          <div class="form-actions form-actions-right">
            <button type="submit" class="btn btn-primary">${editingId ? 'Güncelle' : 'Kavram Ekle'}</button>
            ${editingId ? '<button type="button" id="cancel-edit" class="btn btn-ghost">İptal</button>' : ''}
          </div>
        </form>
      </section>
      <section class="panel list-panel">
        <div class="list-header">
          <h2>Kavramlarım</h2>
          <span class="count-badge">${concepts.length}</span>
        </div>
        ${
          concepts.length === 0
            ? `<p class="empty-state">Henüz kavram eklemedin. Yukarıdaki formu kullanarak başla.</p>`
            : `<div class="concept-grid">
                ${concepts
                  .map((c) => {
                    const lesson = lessons.find((l) => l.id === c.lessonId)
                    return `
                      <article class="concept-card" data-id="${c.id}">
                        <div class="concept-card-header">
                          <div class="concept-card-title-group">
                            ${lesson ? `<span class="concept-lesson-tag">${escapeHtml(lesson.name)}</span>` : ''}
                            <h3>${escapeHtml(c.title)}</h3>
                          </div>
                          <div class="concept-card-actions">
                            <button class="icon-btn edit-btn" data-id="${c.id}" title="Düzenle" aria-label="Düzenle">✎</button>
                            <button class="icon-btn delete-btn" data-id="${c.id}" title="Sil" aria-label="Sil">✕</button>
                          </div>
                        </div>
                        <ul class="fact-list">
                          ${c.facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
                        </ul>
                      </article>
                    `
                  })
                  .join('')}
              </div>`
        }
      </section>
    `

    if (editingConcept) {
      container.querySelector('#concept-title').value = editingConcept.title
      if (editingConcept.lessonId) {
        container.querySelector('#concept-lesson').value = editingConcept.lessonId
      }
      editingConcept.facts.forEach((f, i) => {
        const input = container.querySelector(`.fact-input[data-index="${i}"]`)
        if (input) input.value = f
      })
    }

    bindEvents()
  }

  function createFactFieldHtml(index) {
    const isRequired = index === 0
    return `
      <label class="field fact-field">
        <span>Bilgi ${index + 1}${isRequired ? '' : ' (opsiyonel)'}</span>
        <div class="fact-field-row">
          <input type="text" class="fact-input" data-index="${index}" placeholder="Bu kavramla ilgili bir bilgi" maxlength="140" />
          ${!isRequired ? '<button type="button" class="icon-btn remove-fact-btn" title="Kaldır" aria-label="Kaldır">✕</button>' : ''}
        </div>
      </label>
    `
  }

  function renumberFactFields() {
    const fields = container.querySelectorAll('#facts-fields .fact-field')
    fields.forEach((field, i) => {
      const span = field.querySelector('span')
      if (span) span.textContent = `Bilgi ${i + 1}${i === 0 ? '' : ' (opsiyonel)'}`
      const input = field.querySelector('.fact-input')
      if (input) input.dataset.index = i
      const existingRemove = field.querySelector('.remove-fact-btn')
      if (i === 0 && existingRemove) {
        existingRemove.remove()
      } else if (i > 0 && !existingRemove) {
        const row = field.querySelector('.fact-field-row')
        if (row) {
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'icon-btn remove-fact-btn'
          btn.title = 'Kaldır'
          btn.setAttribute('aria-label', 'Kaldır')
          btn.textContent = '✕'
          row.appendChild(btn)
          btn.addEventListener('click', () => removeFactField(field))
        }
      }
    })
  }

  function addFactField() {
    const fieldsContainer = container.querySelector('#facts-fields')
    const currentCount = fieldsContainer.querySelectorAll('.fact-field').length
    const wrapper = document.createElement('div')
    wrapper.innerHTML = createFactFieldHtml(currentCount)
    const newField = wrapper.firstElementChild
    fieldsContainer.appendChild(newField)
    renumberFactFields()
    const removeBtn = newField.querySelector('.remove-fact-btn')
    if (removeBtn) {
      removeBtn.addEventListener('click', () => removeFactField(newField))
    }
    newField.querySelector('.fact-input').focus()
  }

  function removeFactField(field) {
    field.remove()
    renumberFactFields()
  }

  function bindEvents() {
    container.querySelector('#add-fact-btn').addEventListener('click', addFactField)

    container.querySelectorAll('.remove-fact-btn').forEach((btn) => {
      const field = btn.closest('.fact-field')
      btn.addEventListener('click', () => removeFactField(field))
    })

    container.querySelector('#concept-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const title = container.querySelector('#concept-title').value.trim()
      const lessonId = container.querySelector('#concept-lesson').value || null
      const facts = Array.from(container.querySelectorAll('.fact-input'))
        .map((input) => input.value.trim())
        .filter(Boolean)

      if (!title) {
        showError('Lütfen bir kavram adı gir.')
        return
      }
      if (facts.length < MIN_FACTS) {
        showError(`Lütfen en az ${MIN_FACTS} bilgi gir.`)
        return
      }

      const submitBtn = container.querySelector('#concept-form button[type="submit"]')
      submitBtn.disabled = true
      try {
        if (editingId) {
          await updateConcept(editingId, title, facts, lessonId)
        } else {
          await addConcept(title, facts, lessonId)
        }
      } catch (err) {
        submitBtn.disabled = false
        showError('İşlem başarısız oldu. Lütfen tekrar deneyin.')
        return
      }
      editingId = null
      render()
    })

    const cancelBtn = container.querySelector('#cancel-edit')
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        editingId = null
        render()
      })
    }

    container.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingId = btn.dataset.id
        render()
        container.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })

    container.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (confirm('Bu kavramı silmek istediğine emin misin?')) {
          try {
            await deleteConcept(btn.dataset.id)
          } catch (err) {
            alert('Kavram silinemedi. Lütfen tekrar deneyin.')
            return
          }
          if (editingId === btn.dataset.id) editingId = null
          render()
        }
      })
    })
  }

  function showError(message) {
    const existing = container.querySelector('.form-error')
    if (existing) existing.remove()
    const error = document.createElement('p')
    error.className = 'form-error'
    error.textContent = message
    container.querySelector('#concept-form').appendChild(error)
  }

  render()
}
