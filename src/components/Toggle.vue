<template>
  <div class="container p-0">
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
    enable: true,
  }),
  methods: {
    toggle(status) {
      console.log(`Toggle: ${this.command}, ${this.label}, ${this.status}, ${this.enable}`);
      this.status = status;
      this.$emit('toggle', this.command, status);
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
