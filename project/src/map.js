import { getMapPins, addMapPin, updateMapPin, deleteMapPin } from './storage.js'
import { escapeHtml } from './utils.js'
import { TURKEY_SVG, PROVINCES } from './turkeyMapData.js'

const DEFAULT_FACTS = 4

export function renderMapView(container) {
  let mapPins = []
  let selectedPin = null
  let editingPinId = null
  let mode = 'view'
  let pendingPins = []
  let showLabelsToggle = false

  async function init() {
    container.innerHTML = `<p class="empty-state">Harita yükleniyor…</p>`
    try {
      mapPins = await getMapPins()
    } catch (err) {
      container.innerHTML = `<p class="empty-state">Harita verileri yüklenemedi. Lütfen tekrar deneyin.</p>`
      return
    }
    render()
  }

  function render() {
    container.innerHTML = `
      <section class="panel map-panel">
        <div class="map-header">
          <div>
            <h2>Türkiye İnteraktif Haritası</h2>
            <p class="map-subtitle">Kavram ekle, haritada birden fazla noktaya pin çak, test et.</p>
          </div>
          <div class="map-mode-toggles">
            <button class="btn btn-ghost map-mode-btn ${mode === 'view' ? 'active' : ''}" data-mode="view">Görüntüle</button>
            <button class="btn btn-ghost map-mode-btn ${mode === 'add' ? 'active' : ''}" data-mode="add">Kavram Ekle</button>
          </div>
        </div>

        <div class="map-hint" id="map-hint">
          ${
            mode === 'add'
              ? 'Önce kavram adını gir, sonra harita üzerinde istediğin kadar noktaya tıklayarak pin çak.'
              : 'Kavram eklemek için "Kavram Ekle" moduna geç. Mevcut pinler haritada gösteriliyor.'
          }
        </div>

        <div class="map-container" id="map-container">
          ${TURKEY_SVG}
          <div class="map-pins-overlay" id="pins-overlay"></div>
          <div class="map-tooltip" id="map-tooltip"></div>
        </div>
      </section>

      ${mode === 'add' ? renderAddForm() : ''}

      ${selectedPin && mode === 'view' ? renderPinDetail(selectedPin) : ''}

      <section class="panel list-panel">
        <div class="list-header">
          <h2>Kavram-Pinlerim</h2>
          <span class="count-badge">${mapPins.length}</span>
        </div>
        ${
          mapPins.length === 0
            ? `<p class="empty-state">Henüz kavram eklenmedi. "Kavram Ekle" moduna geçip başla.</p>`
            : `<div class="map-pin-list">
                ${mapPins
                  .map((p) => {
                    return `
                      <div class="map-pin-item" data-id="${p.id}">
                        <div class="map-pin-info">
                          <span class="map-pin-marker"></span>
                          <div>
                            <span class="map-pin-title">${escapeHtml(p.title)}</span>
                            <span class="map-pin-fact-count">${p.pins.length} pin · ${p.facts.length} bilgi</span>
                          </div>
                        </div>
                        <div class="map-pin-actions">
                          <button class="icon-btn pin-show-btn" data-id="${p.id}" title="Haritada Göster" aria-label="Haritada Göster">◎</button>
                          <button class="icon-btn pin-edit-btn" data-id="${p.id}" title="Düzenle" aria-label="Düzenle">✎</button>
                          <button class="icon-btn pin-delete-btn" data-id="${p.id}" title="Sil" aria-label="Sil">✕</button>
                        </div>
                      </div>
                    `
                  })
                  .join('')}
              </div>`
        }
      </section>
    `

    setupMap()
    bindEvents()

    if (mode === 'add') {
      bindAddFormEvents()
    }
  }

  function renderAddForm() {
    return `
      <section class="panel pin-detail-panel">
        <div class="pin-detail-header">
          <h2>Yeni Kavram Ekle</h2>
        </div>
        <form id="new-pin-form" novalidate>
          <label class="field">
            <span>Kavram Adı</span>
            <input type="text" id="new-pin-title" placeholder="Örn: Bakır, Krom, Bor" maxlength="80" />
          </label>

          <div class="facts-fields" id="new-pin-facts">
            ${Array.from({ length: DEFAULT_FACTS })
              .map((_, i) => createFactField(i, false))
              .join('')}
          </div>
          <button type="button" id="new-pin-add-fact" class="btn btn-ghost add-fact-btn">+ Ek Bilgi Ekle</button>

          <div class="pin-placement-section">
            <h3 class="quiz-section-title">Pin Konumları</h3>
            <p class="form-hint">Harita üzerinde tıklayarak bu kavrama ait pinleri ekle. Her pin için isteğe bağlı lokasyon etiketi girebilirsin.</p>
            <div id="pending-pins-list" class="pending-pins-list">
              ${pendingPins.length === 0 ? '<p class="empty-state pending-pins-empty">Henüz pin çakılmadı. Haritaya tıklayarak ekle.</p>' : ''}
              ${pendingPins
                .map(
                  (pp, i) => `
                  <div class="pending-pin-item" data-index="${i}">
                    <span class="pending-pin-number">${i + 1}</span>
                    <input type="text" class="pending-pin-label" data-index="${i}" placeholder="Lokasyon etiketi (örn: Küre, Murgul)" maxlength="60" value="${escapeHtml(pp.label || '')}" />
                    <button type="button" class="icon-btn remove-pending-pin" data-index="${i}" title="Kaldır" aria-label="Kaldır">✕</button>
                  </div>
                `
                )
                .join('')}
            </div>
          </div>

          <label class="quiz-check-item pin-label-toggle">
            <input type="checkbox" id="show-labels-toggle" ${showLabelsToggle ? 'checked' : ''} />
            <span class="quiz-check-label">Pin etiketlerini haritada göster</span>
          </label>

          <div class="form-actions form-actions-right">
            <button type="button" id="new-pin-cancel" class="btn btn-ghost">İptal</button>
            <button type="submit" class="btn btn-primary" id="new-pin-submit">Kavramı Kaydet</button>
          </div>
        </form>
      </section>
    `
  }

  function renderPinDetail(pin) {
    const isEditing = editingPinId === pin.id
    const factCount = isEditing ? Math.max(DEFAULT_FACTS, pin.facts.length) : pin.facts.length

    return `
      <section class="panel pin-detail-panel">
        <div class="pin-detail-header">
          <h2>${isEditing ? 'Kavramı Düzenle' : 'Kavram Detayı'}</h2>
          ${!isEditing ? '<button class="icon-btn pin-detail-close" id="pin-detail-close" title="Kapat" aria-label="Kapat">✕</button>' : ''}
        </div>
        ${
          isEditing
            ? `<form id="pin-edit-form" novalidate>
                <label class="field">
                  <span>Kavram Adı</span>
                  <input type="text" id="pin-edit-title" value="${escapeHtml(pin.title)}" maxlength="80" />
                </label>
                <div class="facts-fields" id="pin-edit-facts">
                  ${Array.from({ length: factCount })
                    .map((_, i) => createFactField(i, true, pin.facts[i]))
                    .join('')}
                </div>
                <button type="button" id="pin-add-fact-btn" class="btn btn-ghost add-fact-btn">+ Ek Bilgi Ekle</button>

                <div class="pin-placement-section">
                  <h3 class="quiz-section-title">Pin Konumları</h3>
                  <p class="form-hint">Harita üzerinde tıklayarak yeni pin ekle veya mevcut pinleri düzenle.</p>
                  <div id="edit-pending-pins-list" class="pending-pins-list">
                    ${editingPendingPins.length === 0 ? '<p class="empty-state pending-pins-empty">Henüz pin çakılmadı. Haritaya tıklayarak ekle.</p>' : ''}
                    ${editingPendingPins
                      .map(
                        (pp, i) => `
                      <div class="pending-pin-item" data-index="${i}">
                        <span class="pending-pin-number">${i + 1}</span>
                        <input type="text" class="pending-pin-label" data-index="${i}" placeholder="Lokasyon etiketi" maxlength="60" value="${escapeHtml(pp.label || '')}" />
                        <button type="button" class="icon-btn remove-edit-pending-pin" data-index="${i}" title="Kaldır" aria-label="Kaldır">✕</button>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                </div>

                <label class="quiz-check-item pin-label-toggle">
                  <input type="checkbox" id="edit-show-labels-toggle" ${pin.showLabels ? 'checked' : ''} />
                  <span class="quiz-check-label">Pin etiketlerini haritada göster</span>
                </label>

                <div class="form-actions form-actions-right">
                  <button type="button" id="pin-edit-cancel" class="btn btn-ghost">İptal</button>
                  <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
              </form>`
            : `<div class="pin-detail-content">
                <h3 class="pin-detail-title">${escapeHtml(pin.title)}</h3>
                <ul class="fact-list pin-detail-facts">
                  ${pin.facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>
                <div class="pin-detail-pins-count">${pin.pins.length} pin konumu · ${pin.showLabels ? 'Etiketler açık' : 'Etiketler kapalı'}</div>
                <div class="form-actions form-actions-right">
                  <button id="pin-edit-start" class="btn btn-ghost">Düzenle</button>
                  <button id="pin-delete-from-detail" class="btn btn-danger-ghost">Sil</button>
                </div>
              </div>`
        }
      </section>
    `
  }

  let editingPendingPins = []

  function createFactField(index, isEditing, existingValue) {
    const isRequired = index === 0
    const value = existingValue !== undefined ? existingValue : ''
    return `
      <label class="field fact-field">
        <span>Bilgi ${index + 1}${isRequired ? '' : ' (opsiyonel)'}</span>
        <div class="fact-field-row">
          <input type="text" class="fact-input" data-index="${index}" placeholder="Bu kavramla ilgili bilgi" maxlength="140" value="${escapeHtml(value)}" />
          ${!isRequired ? '<button type="button" class="icon-btn remove-fact-btn" title="Kaldır" aria-label="Kaldır">✕</button>' : ''}
        </div>
      </label>
    `
  }

  function addDynamicFactField(container, isEditing) {
    const currentCount = container.querySelectorAll('.fact-field').length
    const wrapper = document.createElement('div')
    wrapper.innerHTML = createFactField(currentCount, false)
    const newField = wrapper.firstElementChild
    container.appendChild(newField)
    renumberFactFields(container)
    const removeBtn = newField.querySelector('.remove-fact-btn')
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        newField.remove()
        renumberFactFields(container)
      })
    }
    newField.querySelector('.fact-input').focus()
  }

  function renumberFactFields(container) {
    const fields = container.querySelectorAll('.fact-field')
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
          btn.addEventListener('click', () => {
            field.remove()
            renumberFactFields(container)
          })
        }
      }
    })
  }

  function bindRemoveFactButtons(container) {
    container.querySelectorAll('.remove-fact-btn').forEach((btn) => {
      const field = btn.closest('.fact-field')
      btn.addEventListener('click', () => {
        field.remove()
        renumberFactFields(container)
      })
    })
  }

  function collectFacts(form) {
    return Array.from(form.querySelectorAll('.fact-input'))
      .map((input) => input.value.trim())
      .filter(Boolean)
  }

  function showFormError(form, message) {
    const existing = form.querySelector('.form-error')
    if (existing) existing.remove()
    const error = document.createElement('p')
    error.className = 'form-error'
    error.textContent = message
    form.appendChild(error)
  }

  function renderPendingPin(pin, index) {
    return `
      <div class="pending-pin-item" data-index="${index}">
        <span class="pending-pin-number">${index + 1}</span>
        <input type="text" class="pending-pin-label" data-index="${index}" placeholder="Lokasyon etiketi (örn: Küre, Murgul)" maxlength="60" value="${escapeHtml(pin.label || '')}" />
        <button type="button" class="icon-btn remove-pending-pin" data-index="${index}" title="Kaldır" aria-label="Kaldır">✕</button>
      </div>
    `
  }

  function updatePendingPinsList(listEl, pinsArr, removeClass) {
    if (pinsArr.length === 0) {
      listEl.innerHTML = '<p class="empty-state pending-pins-empty">Henüz pin çakılmadı. Haritaya tıklayarak ekle.</p>'
      return
    }
    listEl.innerHTML = pinsArr.map((pp, i) => renderPendingPin(pp, i)).join('')
    listEl.querySelectorAll(`.${removeClass}`).forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10)
        pinsArr.splice(idx, 1)
        updatePendingPinsList(listEl, pinsArr, removeClass)
        renderPinsOnMap()
      })
    })
    listEl.querySelectorAll('.pending-pin-label').forEach((input) => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.dataset.index, 10)
        pinsArr[idx].label = input.value
      })
    })
  }

  function bindAddFormEvents() {
    const factsContainer = container.querySelector('#new-pin-facts')
    container.querySelector('#new-pin-add-fact').addEventListener('click', () => {
      addDynamicFactField(factsContainer, false)
    })
    bindRemoveFactButtons(factsContainer)

    const pendingList = container.querySelector('#pending-pins-list')
    updatePendingPinsList(pendingList, pendingPins, 'remove-pending-pin')

    const showLabelsEl = container.querySelector('#show-labels-toggle')
    if (showLabelsEl) {
      showLabelsEl.addEventListener('change', () => {
        showLabelsToggle = showLabelsEl.checked
        renderPinsOnMap()
      })
    }

    container.querySelector('#new-pin-cancel').addEventListener('click', () => {
      mode = 'view'
      pendingPins = []
      showLabelsToggle = false
      render()
    })

    container.querySelector('#new-pin-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const title = container.querySelector('#new-pin-title').value.trim()
      const facts = collectFacts(container.querySelector('#new-pin-form'))
      if (!title) {
        showFormError(container.querySelector('#new-pin-form'), 'Lütfen bir kavram adı gir.')
        return
      }
      if (facts.length < 1) {
        showFormError(container.querySelector('#new-pin-form'), 'Lütfen en az 1 bilgi gir.')
        return
      }
      if (pendingPins.length < 1) {
        showFormError(container.querySelector('#new-pin-form'), 'Lütfen harita üzerinde en az 1 pin çak.')
        return
      }
      const submitBtn = container.querySelector('#new-pin-submit')
      submitBtn.disabled = true
      try {
        await addMapPin(title, facts, pendingPins, showLabelsToggle)
      } catch (err) {
        submitBtn.disabled = false
        showFormError(container.querySelector('#new-pin-form'), 'Kavram eklenemedi. Lütfen tekrar deneyin.')
        return
      }
      mode = 'view'
      pendingPins = []
      showLabelsToggle = false
      await refreshPins()
      render()
    })
  }

  function setupMap() {
    const mapContainer = container.querySelector('#map-container')
    if (!mapContainer) return
    const svg = mapContainer.querySelector('svg')
    if (!svg) return

    svg.style.width = '100%'
    svg.style.height = 'auto'
    svg.style.display = 'block'

    const tooltip = container.querySelector('#map-tooltip')

    svg.addEventListener('mouseover', (e) => {
      if (e.target.tagName === 'path') {
        const parent = e.target.parentNode
        const ilAdi = parent.getAttribute('data-iladi')
        if (ilAdi && parent.id !== 'guney-kibris') {
          if (tooltip) {
            tooltip.textContent = ilAdi
            tooltip.style.display = 'block'
          }
          e.target.style.cursor = 'pointer'
        }
      }
    })

    svg.addEventListener('mousemove', (e) => {
      if (tooltip && tooltip.style.display === 'block') {
        const rect = mapContainer.getBoundingClientRect()
        tooltip.style.left = e.clientX - rect.left + 12 + 'px'
        tooltip.style.top = e.clientY - rect.top + 12 + 'px'
      }
    })

    svg.addEventListener('mouseout', (e) => {
      if (e.target.tagName === 'path') {
        if (tooltip) tooltip.style.display = 'none'
      }
    })

    svg.addEventListener('click', (e) => {
      if (e.target.tagName === 'path') {
        const parent = e.target.parentNode
        if (parent.id === 'guney-kibris' || parent.id === 'turkiye') return

        if (mode === 'add' || (mode === 'view' && editingPinId)) {
          addPinFromClick(e, svg)
        } else if (mode === 'view') {
          highlightProvince(parent.id)
        }
      } else if (mode === 'add' || (mode === 'view' && editingPinId)) {
        addPinFromClick(e, svg)
      }
    })

    renderPinsOnMap()
  }

  function addPinFromClick(e, svg) {
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const pinData = { x, y, label: '' }

    if (mode === 'add') {
      pendingPins.push(pinData)
      const listEl = container.querySelector('#pending-pins-list')
      if (listEl) updatePendingPinsList(listEl, pendingPins, 'remove-pending-pin')
    } else if (editingPinId) {
      editingPendingPins.push(pinData)
      const listEl = container.querySelector('#edit-pending-pins-list')
      if (listEl) updatePendingPinsList(listEl, editingPendingPins, 'remove-edit-pending-pin')
    }
    renderPinsOnMap()
  }

  function renderPinsOnMap() {
    const overlay = container.querySelector('#pins-overlay')
    if (!overlay) return

    let allPinsHtml = ''

    if (mode === 'add') {
      allPinsHtml = pendingPins
        .map(
          (pp, i) =>
            `<div class="map-pin-marker-overlay pending" style="left: ${pp.x}%; top: ${pp.y}%;">
              <span class="pin-dot pin-dot-pending"></span>
              ${showLabelsToggle && pp.label ? `<span class="pin-label">${escapeHtml(pp.label)}</span>` : `<span class="pin-number">${i + 1}</span>`}
            </div>`
        )
        .join('')
    } else if (editingPinId) {
      const pin = mapPins.find((p) => p.id === editingPinId)
      if (pin) {
        allPinsHtml = editingPendingPins
          .map(
            (pp, i) =>
              `<div class="map-pin-marker-overlay pending" style="left: ${pp.x}%; top: ${pp.y}%;">
                <span class="pin-dot pin-dot-pending"></span>
                ${pin.showLabels && pp.label ? `<span class="pin-label">${escapeHtml(pp.label)}</span>` : `<span class="pin-number">${i + 1}</span>`}
              </div>`
          )
          .join('')
      }
    } else {
      allPinsHtml = mapPins
        .map((p) => {
          return p.pins
            .map(
              (pp) =>
                `<div class="map-pin-marker-overlay" data-pin-id="${p.id}" style="left: ${pp.x}%; top: ${pp.y}%;">
                  <span class="pin-dot"></span>
                  ${p.showLabels && pp.label ? `<span class="pin-label">${escapeHtml(pp.label)}</span>` : ''}
                </div>`
            )
            .join('')
        })
        .join('')
    }

    overlay.innerHTML = allPinsHtml

    if (mode === 'view' && !editingPinId) {
      overlay.querySelectorAll('.map-pin-marker-overlay').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const pin = mapPins.find((p) => p.id === el.dataset.pinId)
          if (pin) {
            selectedPin = pin
            render()
          }
        })
      })
    }
  }

  function highlightProvince(provinceId) {
    const svg = container.querySelector('#map-container svg')
    if (!svg) return
    svg.querySelectorAll('g[id] path').forEach((path) => {
      path.classList.remove('province-highlighted')
    })
    const provinceGroup = svg.querySelector(`#${provinceId}`)
    if (provinceGroup) {
      provinceGroup.querySelectorAll('path').forEach((path) => {
        path.classList.add('province-highlighted')
      })
    }
  }

  function bindEvents() {
    container.querySelectorAll('.map-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode
        pendingPins = []
        showLabelsToggle = false
        if (mode !== 'view') {
          selectedPin = null
          editingPinId = null
        }
        render()
      })
    })

    const closeBtn = container.querySelector('#pin-detail-close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        selectedPin = null
        render()
      })
    }

    const editStartBtn = container.querySelector('#pin-edit-start')
    if (editStartBtn) {
      editStartBtn.addEventListener('click', () => {
        editingPinId = selectedPin.id
        editingPendingPins = selectedPin.pins.map((p) => ({ ...p }))
        render()
      })
    }

    const deleteFromDetail = container.querySelector('#pin-delete-from-detail')
    if (deleteFromDetail) {
      deleteFromDetail.addEventListener('click', async () => {
        if (confirm('Bu kavramı silmek istediğine emin misin?')) {
          try {
            await deleteMapPin(selectedPin.id)
          } catch (err) {
            alert('Kavram silinemedi.')
            return
          }
          selectedPin = null
          await refreshPins()
          render()
        }
      })
    }

    const editForm = container.querySelector('#pin-edit-form')
    if (editForm) {
      const factsContainer = editForm.querySelector('#pin-edit-facts')
      const addFactBtn = container.querySelector('#pin-add-fact-btn')
      if (addFactBtn) {
        addFactBtn.addEventListener('click', () => addDynamicFactField(factsContainer, true))
      }
      bindRemoveFactButtons(factsContainer)

      const editPendingList = container.querySelector('#edit-pending-pins-list')
      updatePendingPinsList(editPendingList, editingPendingPins, 'remove-edit-pending-pin')

      const editShowLabels = container.querySelector('#edit-show-labels-toggle')
      if (editShowLabels) {
        editShowLabels.addEventListener('change', () => {
          renderPinsOnMap()
        })
      }

      editForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const title = container.querySelector('#pin-edit-title').value.trim()
        const facts = collectFacts(editForm)
        const showLabels = container.querySelector('#edit-show-labels-toggle').checked
        if (!title) {
          showFormError(editForm, 'Lütfen bir kavram adı gir.')
          return
        }
        if (facts.length < 1) {
          showFormError(editForm, 'Lütfen en az 1 bilgi gir.')
          return
        }
        if (editingPendingPins.length < 1) {
          showFormError(editForm, 'Lütfen en az 1 pin konumu bırak.')
          return
        }
        const submitBtn = editForm.querySelector('button[type="submit"]')
        submitBtn.disabled = true
        try {
          await updateMapPin(selectedPin.id, title, facts, editingPendingPins, showLabels)
        } catch (err) {
          submitBtn.disabled = false
          showFormError(editForm, 'Kavram güncellenemedi.')
          return
        }
        editingPinId = null
        editingPendingPins = []
        await refreshPins()
        selectedPin = mapPins.find((p) => p.id === selectedPin.id)
        render()
      })

      const cancelBtn = container.querySelector('#pin-edit-cancel')
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          editingPinId = null
          editingPendingPins = []
          render()
        })
      }
    }

    container.querySelectorAll('.pin-show-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pin = mapPins.find((p) => p.id === btn.dataset.id)
        if (pin) {
          selectedPin = pin
          render()
          container.querySelector('.pin-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })

    container.querySelectorAll('.pin-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pin = mapPins.find((p) => p.id === btn.dataset.id)
        if (pin) {
          selectedPin = pin
          editingPinId = pin.id
          editingPendingPins = pin.pins.map((p) => ({ ...p }))
          render()
          container.querySelector('.pin-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })

    container.querySelectorAll('.pin-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (confirm('Bu kavramı silmek istediğine emin misin?')) {
          try {
            await deleteMapPin(btn.dataset.id)
          } catch (err) {
            alert('Kavram silinemedi.')
            return
          }
          if (selectedPin && selectedPin.id === btn.dataset.id) selectedPin = null
          await refreshPins()
          render()
        }
      })
    })
  }

  async function refreshPins() {
    try {
      mapPins = await getMapPins()
    } catch (err) {
      mapPins = []
    }
  }

  init()
}

export function getMapQuizData() {
  return getMapPins()
}
