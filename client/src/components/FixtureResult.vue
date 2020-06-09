<template>
	<div>
		<div v-if="winner" class="columns">
			<div class="column is-three-quarters">
				<p class="title is-5">{{winner}} won</p>
			</div>
			<div class="column">
				<b-icon class="ml-05" icon="trophy"/>
			</div>
		</div>
		<div v-else-if="fixture.result == 'draw'" class="columns">
			<div class="column is-three-quarters">
				<p class="title is-5">Draw result</p>
			</div>
			<div class="column">
				<b-icon class="ml-05" icon="equal"/>
			</div>
		</div>
		<div v-else-if="fixture.result == 'canceled'" class="columns">
			<div class="column is-three-quarters">
				<p class="title is-5">Match canceled</p>
			</div>
			<div class="column">
				<b-icon class="ml-05" icon="cancel"/>
			</div>
		</div>	
	</div>
	
</template>
<script>

export default {
	props: {
		fixture: Object,
	},
	data() {
		return {
			winner: null
		}
	},
	created(){
		if (this.fixture.result == this.fixture.feedHomeTeamName)
			this.winner = this.fixture.homeTeam;
		else if  (this.fixture.result == this.fixture.feedAwayTeamName)
			this.winner = this.fixture.awayTeam;
	}
}
</script>
