<template>
    <nav class="navbar navbar-dark sticky-top flex-md-nowrap p-2 shadow">
        <h2> {{msg}} </h2>
    </nav>
</template>
<script>
export default {
  name: 'TopBar',
  props: {
    msg: String,
  },
};
</script>
