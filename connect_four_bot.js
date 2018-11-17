'use strict';

class Disc {
	constructor(player) {
		this.player = player;
	}
}

class Bot {
	moveWin() {
		const winningColumns = this.availableColumns.filter(column => {
			let row = 5;
			
			while (field[row][column] !== null) {
				row -= 1;
			}
			
			return checkVictory(row, column);
		});
		
		if (winningColumns.length > 0) {
			this.availableColumns = winningColumns;
		}
	}

	movePreventWin() {
		currentPlayer = currentPlayer === 1 ? 2 : 1;
		
		this.moveWin();
		
		currentPlayer = currentPlayer === 1 ? 2 : 1;
	}

	movePreventLoss() {
		currentPlayer = currentPlayer === 1 ? 2 : 1;
		
		const safeColumns = this.availableColumns.filter(column => {
			let row = 5;
			
			while (field[row][column] !== null) {
				row -= 1;
			}
			
			return row === 0 || !checkVictory(row - 1, column);
		});
		
		currentPlayer = currentPlayer === 1 ? 2 : 1;
		
		if (safeColumns.length > 0) {
			this.availableColumns = safeColumns;
		}
	}

	moveSetupDouble() {
		const setupColumns = this.availableColumns.filter(column => {
			let row = 5;
			
			while (field[row][column] !== null) {
				row -= 1;
			}
			
			field[row][column] = new Disc(currentPlayer);
			
			const winningColumns = this.availableColumns.filter(column => {
				let row = 5;
				
				while (row >= 0) {
					if (field[row][column] !== null) {
						row -= 1;
					} else {
						return checkVictory(row, column);
					}
				}
				
				return false;
			});
			
			field[row][column] = null;
			
			return winningColumns.length > 1;
		});
		
		if (setupColumns.length > 0) {
			this.availableColumns = setupColumns;
		}
	}

	movePreventDouble() {
		currentPlayer = currentPlayer === 1 ? 2 : 1;
		
		this.moveSetupDouble();
		
		currentPlayer = currentPlayer === 1 ? 2 : 1;
	}

	moveSetupAdvantages(indirectly) {
		let maxAdvantagesColumns = [];
		let maxAdvantages = 0;
		
		for (const column of this.availableColumns) {
			let row = 5;
			
			while (field[row][column] !== null) {
				row -= 1;
			}
			
			field[row][column] = new Disc(currentPlayer);
			
			let advantages = 0;
			
			for (const column of this.availableColumns) {
				let row = 5;
				
				while (row >= 0) {
					if (field[row][column] !== null) {
						row -= 1;
					} else {
						if (indirectly) {
							for (let r = row - 1; r >= 0; r -= 1) {
								advantages += checkVictory(r, column);
							}
						} else {
							advantages += checkVictory(row, column);
						}
						
						break;
					}
				}
			}
			
			field[row][column] = null;
			
			if (advantages > maxAdvantages) {
				maxAdvantages = advantages;
				maxAdvantagesColumns = [column];
			} else if (advantages === maxAdvantages) {
				maxAdvantagesColumns.push(column);
			}
		}
		
		this.availableColumns = maxAdvantagesColumns;
	}

	moveSetupWinsLater() {
		this.moveSetupAdvantages(true);
	}

	moveSetupWinsNow() {
		this.moveSetupAdvantages(false);
	}

	moveRecursive(column, recursionLevels) {
		let wins = 0;
		let losses = 0
		let draws = 0;
		
		if (recursionLevels > 0) {
			let row = 5;
			
			while (field[row][column] !== null) {
				row -= 1;
			}
			
			if (checkVictory(row, column)) {
				wins += 1;
			} else {
				field[row][column] = new Disc(currentPlayer);
				
				this.availableColumns = [0, 1, 2, 3, 4, 5, 6].filter(column => field[0][column] === null);
				
				if (this.availableColumns.length > 0) {				
					currentPlayer = currentPlayer === 1 ? 2 : 1;
					
					this.moveWin();
					this.movePreventWin();
					this.movePreventLoss();
					this.moveSetupDouble();
					this.movePreventDouble();
					this.moveSetupWinsLater();
					this.moveSetupWinsNow();
					
					for (const column of this.availableColumns) {
						let row = 5;
						
						while (field[row][column] !== null) {
							row -= 1;
						}
						
						if (checkVictory(row, column)) {
							losses += 1;
						} else {
							field[row][column] = new Disc(currentPlayer);
							
							this.availableColumns = [0, 1, 2, 3, 4, 5, 6].filter(column => field[0][column] === null);
							
							if (this.availableColumns.length > 0) {								
								currentPlayer = currentPlayer === 1 ? 2 : 1;
								
								this.moveWin();
								this.movePreventWin();
								this.movePreventLoss();
								this.moveSetupDouble();
								this.movePreventDouble();
								this.moveSetupWinsLater();
								this.moveSetupWinsNow();
								
								for (const column of this.availableColumns) {
									const outcome = this.moveRecursive(column, recursionLevels - 1);
									
									wins += outcome.wins;
									losses += outcome.losses;
									draws += outcome.draws;
								}
								
								currentPlayer = currentPlayer === 1 ? 2 : 1;
							} else {
								draws += 1;
							}
							
							field[row][column] = null;
						}
					}
					
					currentPlayer = currentPlayer === 1 ? 2 : 1;
				} else {
					draws += 1;
				}
				
				field[row][column] = null;
			}
		} else {
			draws += 1;
		}
		
		return { wins, losses, draws };
	}

	moveRecursiveStart() {
		let maxWinRatioColumns = [];
		let maxWinRatio = -1;
		
		for (const column of this.availableColumns) {
			const { wins, losses, draws } = this.moveRecursive(column, 3);
			const winRatio = (wins - losses) / (wins + losses + draws);
			
			if (winRatio > maxWinRatio) {
				maxWinRatio = winRatio;
				maxWinRatioColumns = [column];
			} else if (winRatio === maxWinRatio) {
				maxWinRatioColumns.push(column);
			}
		}
		
		this.availableColumns = maxWinRatioColumns;
	}

	move() {
		this.availableColumns = [0, 1, 2, 3, 4, 5, 6].filter(column => field[0][column] === null);
		
		this.moveWin();
		this.movePreventWin();
		this.movePreventLoss();
		this.moveSetupDouble();
		this.movePreventDouble();
		this.moveSetupWinsLater();
		this.moveSetupWinsNow();
		this.moveRecursiveStart();
		
		const columnChosen = this.availableColumns[Math.floor(Math.random() * this.availableColumns.length)];
		
		return columnChosen;
	}
}

const bot = new Bot();
let currentPlayer;
let field;

onmessage = ({ data: { type, payload } }) => {
	switch (type) {
		case 'INITIALIZE':
			currentPlayer = payload;
			break;
		case 'UPDATE':
			field = payload;
			postMessage(bot.move());
	}
};

function checkVictory(row, column) {
	return checkFour(row, column, -1, 1) || checkFour(row, column, 0, 1) || checkFour(row, column, 1, 1) || checkFour(row, column, 1, 0);
}
	
function checkFour(row, column, rowDelta, columnDelta) {
	const longestChain = [field[row][column]];
	let currentRow = row;
	let currentColumn = column;
	let currentDisc = null;
	let switchedDirection = false;

	while (true) {
		currentRow += rowDelta;
		currentColumn += columnDelta;
		
		currentDisc = currentRow < 0 || currentRow > 5 || currentColumn < 0 || currentColumn > 6 ? null : field[currentRow][currentColumn];
		
		if (currentDisc === null || currentDisc.player !== currentPlayer) {
			if (switchedDirection) {
				break;
			}
			
			rowDelta = -rowDelta;
			columnDelta = -columnDelta;
			
			switchedDirection = true;
			
			currentRow = row;
			currentColumn = column;
		} else {
			longestChain.push(currentDisc);
		}
	}
	
	return longestChain.length >= 4;
}