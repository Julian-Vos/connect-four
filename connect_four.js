(function() {
	'use strict';
	
	const canvas = document.getElementById('game');
	
	canvas.width = 700;
	canvas.height = 600;
	
	const context = canvas.getContext('2d');
	
	context.font = '28px Arial, Helvetica, sans-serif';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	
	class Menu {
		constructor() {
			this.player1 = 'Human';
			this.player2 = 'Intermediate';
			
			this.buttons = [
				new MenuButton(100, 100, 'player1', 'Human'),
				new MenuButton(100, 185, 'player1', 'Random'),
				new MenuButton(100, 270, 'player1', 'Intermediate'),
				new MenuButton(100, 355, 'player1', 'Expert'),
				new MenuButton(100, 440, 'player1', 'Recursive'),
				
				new MenuButton(400, 100, 'player2', 'Human'),
				new MenuButton(400, 185, 'player2', 'Random'),
				new MenuButton(400, 270, 'player2', 'Intermediate'),
				new MenuButton(400, 355, 'player2', 'Expert'),
				new MenuButton(400, 440, 'player2', 'Recursive')
			];
		}
		
		draw() {
			context.fillStyle = 'blue';
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			this.buttons.forEach((menuButton) => {
				menuButton.draw();
			});
		}
	}
	
	class MenuButton {
		constructor(x, y, property, value) {
			this.x = x;
			this.y = y;
			
			this.property = property;
			this.value = value;
			
			this.hovered = false;
		}
		
		hover(mouseX, mouseY) {
			this.hovered = (mouseX >= this.x && mouseX < this.x + 200 && mouseY >= this.y && mouseY < this.y + 60);
		}
		
		click() {
			if (this.hovered) {
				menu[this.property] = this.value;
			}
		}
		
		draw() {
			if (this.hovered) {
				context.fillStyle = 'navy';
				context.fillRect(this.x, this.y, 200, 60);
			}
			
			context.strokeRect(this.x, this.y, 200, 60);
			
			if (menu[this.property] === this.value) {
				context.strokeRect(this.x + 1, this.y + 1, 198, 58);
			}
			
			context.fillStyle = 'black';
			context.fillText(this.value, this.x + 100, this.y + 30);
		}
	}
	
	canvas.addEventListener('mousemove', ({ clientX, clientY }) => {
		const boundingClientRect = canvas.getBoundingClientRect();
		
		const mouseX = clientX - boundingClientRect.left;
		const mouseY = clientY - boundingClientRect.top;
		
		menu.buttons.forEach((menuButton) => {
			menuButton.hover(mouseX, mouseY);
		});
	});
	
	canvas.addEventListener('mouseleave', () => {
		menu.buttons.forEach((menuButton) => {
			menuButton.hovered = false;
		});
	});
	
	canvas.addEventListener('click', () => {		
		menu.buttons.forEach((menuButton) => {
			menuButton.click();
		});
	});
	
	class Disc {
		constructor(player, animationOffset) {
			this.player = player;
			this.animationOffset = animationOffset;
			this.winning = false;
		}
	}
	
	class BotWorker {
		constructor(playerID) {
			this.worker = new Worker('connect_four_bot.js');
			
			this.worker.postMessage({ type: 'INITIALIZE', payload: playerID });
			
			this.worker.onmessage = ({ data: column }) => {
				setTimeout(() => {
					dropDisc(column);
					
					canvas.style.cursor = 'auto';
				}, 500 - (performance.now() - this.startTime));
			};
		}
		
		move() {
			canvas.style.cursor = 'wait';
			
			this.startTime = performance.now();
			
			this.worker.postMessage({ type: 'UPDATE', payload: field });
		}
		
		terminate() {
			this.worker.terminate();
		}
	}
	
	const menu = new Menu();
	const bots = [null, new BotWorker(2)];
	const field = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null));	
	let currentPlayer = 1;
	let blockPlay = false;
	let state = 'menu';
	
	function drawField() {
		context.fillStyle = 'blue';
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		for (let r = 5; r >= 0; r -= 1) {
			for (let c = 0; c < 7; c += 1) {
				const disc = field[r][c];
				
				if (disc !== null) {
					if (disc.animationOffset > 0) {
						disc.animationOffset -= 20;
					}
					
					context.fillStyle = disc.player === 1 ? 'yellow' : 'red';
					
					context.beginPath();
					context.arc(c * 100 + 50, r * 100 + 50 - disc.animationOffset, 45, 0, 2 * Math.PI);
					context.fill();
					
					if (disc.winning) {
						context.beginPath();
						context.arc(c * 100 + 50, r * 100 + 50 - disc.animationOffset, 15, 0, 2 * Math.PI);
						context.stroke();
					}
				}
				
				context.beginPath();
				context.arc(c * 100 + 50, r * 100 + 50, 45, 0, 2 * Math.PI);
				context.stroke();
			}
		}
	}
	
	document.addEventListener('keydown', ({ key }) => {
		if (key === 'Enter') {
			state = 'game';
			
			canvas.addEventListener('click', ({ clientX }) => {
				if (blockPlay) {
					return;
				}
				
				const columnClicked = Math.floor((clientX - canvas.getBoundingClientRect().left) / 100);
				
				dropDisc(columnClicked);
			});
			
			document.addEventListener('keydown', ({ repeat, key }) => {
				if (blockPlay || repeat) {
					return;
				}
				
				if (key >= '1' && key <= '7') {
					const columnPressed = Number(key) - 1;
					
					dropDisc(columnPressed);
				}
			});
		}
	});
	
	function dropDisc(column) {
		let row = 5;
		
		while (row >= 0) {
			if (field[row][column] !== null) {
				row -= 1;
			} else {
				field[row][column] = new Disc(currentPlayer, row * 100 + 100);
				
				if (checkVictory(row, column)) {
					blockPlay = true;
					
					if (bots[0] !== null) {
						bots[0].terminate();
					}
					
					if (bots[1] !== null) {
						bots[1].terminate();
					}
				} else {
					switchPlayers();
				}
				
				return;
			}
		}
	}
	
	function checkVictory(row, column) {
		return [checkFour(row, column, -1, 1), checkFour(row, column, 0, 1), checkFour(row, column, 1, 1), checkFour(row, column, 1, 0)].includes(true);
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
		
		if (longestChain.length >= 4) {
			longestChain.forEach(disc => {
				disc.winning = true;
			});
			
			return true;
		}
		
		return false;
	}
	
	function switchPlayers() {
		currentPlayer = currentPlayer === 1 ? 2 : 1;
		
		if (bots[currentPlayer - 1] === null) {
			blockPlay = false;
		} else {
			blockPlay = true;
			
			bots[currentPlayer - 1].move();
		}
	}
	
	if (bots[0] !== null) {
		blockPlay = true;
		
		bots[currentPlayer - 1].move();
	}
	
	function drawLoop() {
		switch (state) {
			case 'menu':
				menu.draw();
				break;
			case 'game':
				drawField();
		}
		
		requestAnimationFrame(drawLoop);
	}
	
	drawLoop();
})();