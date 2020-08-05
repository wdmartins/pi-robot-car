<template>
  <div class="container">
    <div @click="toggle(!status)" class="float-left">
      <img v-if="status" class="large" src="../assets/toggle-on.svg" />
      <img v-else class="large" src="../assets/toggle-off.svg" />
      {{label}}
    </div>
  </div>
</template>

<script>
export default {
  name: 'toggle',
  props: {
    command: String,
    label: String,
  },
  data: () => ({
    status: false,
  }),
  methods: {
    toggle(status) {
      this.status = status;
      this.$emit(this.command, status);
    },
  },
};
</script>

<style>
.large {
  width: 2em;
  height: 2em;
  cursor: pointer;
}
</style>
