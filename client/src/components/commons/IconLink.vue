<template>
<div ref="icon-link">
	<a :href="link" :target="newTab ? '_blank' : ''" rel="noopener noreferrer">
		<v-icon 
			name='external-link' 
			:class="{
				'link-icon-small' : isSmall,
				'link-icon-big' : !isSmall
			}"
		/>
	</a>
	</div>
</template>

<script>

export default {
	props: {
		link: {
			type: String
		},
		isSmall:{
			type:Boolean,
			required: false
		},
		newTab:{
			type:Boolean,
			required: false
		},
	}
}
</script>

<style lang='scss'>
	.link-icon-small{
		height: 1.5rem;
		width: 1.5rem;
		margin-bottom:-0.3rem;
		color: rgb(88, 74, 209);
	}
	.link-icon-big{
		height: 3rem;
		width: 3rem;
		margin: 1rem;
		color: rgb(88, 74, 209);
	}
</style>
