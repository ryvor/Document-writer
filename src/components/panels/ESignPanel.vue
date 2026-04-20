<template>
  <div class="panel-body">

    <div class="meta-field">
      <label class="meta-label">Signer Name</label>
      <input class="sc-input" :value="esign.signerName" @input="update('signerName', $event.target.value)" placeholder="Full name" />
    </div>

    <div class="meta-field">
      <label class="meta-label">Email</label>
      <input class="sc-input" type="email" :value="esign.signerEmail" @input="update('signerEmail', $event.target.value)" placeholder="email@example.com" />
    </div>

    <div class="meta-field">
      <label class="meta-label">Title / Role</label>
      <input class="sc-input" :value="esign.signerTitle" @input="update('signerTitle', $event.target.value)" placeholder="Job title" />
    </div>

    <div class="meta-field">
      <label class="meta-label">Company</label>
      <input class="sc-input" :value="esign.signerCompany" @input="update('signerCompany', $event.target.value)" placeholder="Company name" />
    </div>

    <div class="meta-field">
      <label class="meta-label">Signature Note</label>
      <textarea class="sc-input meta-textarea" :value="esign.signatureNote" @input="update('signatureNote', $event.target.value)" placeholder="Optional note to display near signature" rows="2" />
    </div>

    <!-- Stamp preview -->
    <div class="esign-stamp-preview" v-if="esign.signerName">
      <div class="esign-stamp">
        <div class="esign-stamp-sig">
          <font-awesome-icon icon="signature" />
          <span>{{ esign.signerName }}</span>
        </div>
        <div class="esign-stamp-meta">
          <span v-if="esign.signerTitle">{{ esign.signerTitle }}</span>
          <span v-if="esign.signerCompany"> · {{ esign.signerCompany }}</span>
        </div>
        <div class="esign-stamp-date">Signed: [date will appear here]</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { documentStore } from '../../stores/documentStore.js'

const props = defineProps({
  docId: { type: String, required: true },
})

const esign = computed(() => {
  const doc = documentStore.documents.find(d => d.id === props.docId) || documentStore.active
  return doc?.esign || {}
})

function update(field, value) {
  documentStore.updateEsign(props.docId, { [field]: value })
}
</script>
