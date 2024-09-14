let addModal = true;
let ticketPriorityColor = 'red';
let taskArr = [];
let currentStatus = 'todo';
let removeflag = false;
let lastFocusArea = null;

// Drag and drop API
dragStartEventHandler = (event) => {
    let selectedTicket = event.target;
    event.dataTransfer.setData('text/plain',selectedTicket.id);
    selectedTicket.classList.add('dragging');
};
dragEndEventHandler = (event) => {
    let selectedTicket = event.target;
    selectedTicket.classList.remove('dragging');
};
dropEventHandler = (event) => {
    let selectedTicket = event.target;
    
    let closestCont = selectedTicket.closest('.ticket-container');
    let ticketId = event.dataTransfer.getData('text/plain');
    console.log(ticketId);
    let droppedTicket = query(`#${ticketId}`);
    
    if (droppedTicket && closestCont) {
        let sourceCont = droppedTicket.closest('.ticket-container');
        console.log(sourceCont);
        sourceCont.removeChild(droppedTicket);
        closestCont.appendChild(droppedTicket);

        let updatedStatus = closestCont.id;
        
        let idx = taskArr.findIndex(id => id.id === ticketId);
        taskArr[idx].status = updatedStatus;
        addToLocalStorage(taskArr);
    }
};

// setting the remove flag
const toggleRemoveFlag = () => {
    removeflag = !removeflag;
    query('.fa-trash').style.color = removeflag ? 'red' : 'black';
}

// delete tickets
const deleteTicketsHandler = (ticketCont,id) => {
    ticketCont.addEventListener('click', () => {
        if (removeflag) {
            ticketCont.remove();

            let idx = taskArr.findIndex((obj) => {
                return obj.id === id;
            });
           
            if (idx != -1) {
                taskArr.splice(idx,1);
            }
            addToLocalStorage(taskArr);
        }
    });

    
};

// updating the tickets and persist them in memory
const updateTickets = (ticketCont,id) => {
    // console.log(ticketCont,id);
    let lockUnlockBtn = ticketCont.querySelector('.fa-solid');
    let ticketTask = ticketCont.querySelector('.ticket-task');

    lockUnlockBtn.addEventListener('click', () => {
        lockUnlockBtn.classList.toggle('fa-lock');
        lockUnlockBtn.classList.toggle('fa-unlock');

        if (lockUnlockBtn.classList.contains('fa-unlock')) {
            ticketTask.setAttribute('contenteditable','true');
        }else if (lockUnlockBtn.classList.contains('fa-lock')) {
            ticketTask.setAttribute('contenteditable','false');
            taskArr.forEach((ticket) => {
                if (ticket.id === id) {
                  ticket.task = ticketTask.textContent;
                  addToLocalStorage(taskArr);
              }
            });
        }
    });
};

// filtering or grouping of tickets 
const filterTickets = (event) => {
    let filterTickets = taskArr.filter(tickets => tickets.color === event.target.classList[1]);
    queryAll('.ticket-cont').forEach((item) => {
        item.remove();
    });
    renderTickets(filterTickets);
};

// add tickets to localStorage
const addToLocalStorage = () => {
    localStorage.setItem('tickets',JSON.stringify(taskArr));
};

// on page refresh persist the tickets
const appendTicketElement = (container,id,color,task) => {
    let el = createTicketEl(task,id,color);
    container.appendChild(el);
    updateTickets(el,id);
    deleteTicketsHandler(el,id);
};

const renderTickets = (tasks) => {
    tasks.forEach(({id,color,status,task}) => {
        let container = query(`#${status}`);
        appendTicketElement(container,id,color,task);
    });
};

const getTicketsFromLocalStorage = () => {
    let storedTickets = JSON.parse(localStorage.getItem('tickets'));
    return storedTickets ? storedTickets : [];
};

// set tickets priority color
const setPriorityColor = (event) => {
    queryAll('.priority-color').forEach((item) => {
        item.classList.remove('active');
    });
    let classes = event.target.classList;
    event.target.classList.add('active');
    // console.log(classes);
    ticketPriorityColor = classes[1];
};

// create ticket element
const createTicketEl = (task,id,priorityColor) => {
    const ticketCont = document.createElement('div');
    ticketCont.className = 'ticket-cont';
    ticketCont.id = id;
    ticketCont.draggable = 'true';

    ticketCont.innerHTML = `
    <div class="ticket-color ${priorityColor}"></div>
    <div class="ticket-id">${id}</div>
    <div class="ticket-task">${task}</div>
    <div class="lock-unlock">
        <i class="fa-solid fa-lock"></i>
    </div>
    `
   return ticketCont;
};

// creating ticket in to do
const createTicketInToDo = () => {
    const text = query('.modal-textarea');
    let task = text.value.trim();

    if (task) {
        const id = `INC${new ShortUniqueId().randomUUID()}`;
        let ticket = createTicketEl(task,id,ticketPriorityColor);
        query('.error').style.display = 'none';
        query('#todo').appendChild(ticket);
        let ticketObj = {id,task,color:ticketPriorityColor,status:currentStatus};
        taskArr.push(ticketObj);
        addToLocalStorage();
        closeModal();
        text.value = '';
        updateTickets(ticket,id);
        deleteTicketsHandler(ticket,id);
    }

};

// open modal
const toggleModal = () => {
  let modal = query(".modal-overlay");
  
  if (addModal) {
    lastFocusArea = document.activeElement;
    console.log(lastFocusArea);
    modal.style.display = 'flex';
    query('.modal-textarea').focus();
  }else {
    modal.style.display = 'none';
    if (lastFocusArea) {
        lastFocusArea.focus();
    }
  }

  addModal = !addModal;
};

// close modal
const closeModal = () => {
  toggleModal();
};

// helper functions
const query = (selector) => document.querySelector(selector);
const queryAll = (selector) => document.querySelectorAll(selector);

// setup all the eventListener here
const setupEventListener = () => {
  query(".toolbox-cont").addEventListener("click", (event) => {
    let targetBtn = event.target.classList;
    if (targetBtn.contains("fa-plus")) {
      toggleModal();
    }else if (targetBtn.contains("fa-trash")) {
        toggleRemoveFlag();
    }
  });

  query(".modal-close-btn").addEventListener("click", () => {
    closeModal();
  });

  query('.create-task').addEventListener("click", createTicketInToDo);

  queryAll('.priority-color').forEach((item) => {
    item.addEventListener('click', setPriorityColor);
  });

  query('.toolbox-priority-cont').addEventListener("click", (event) => {
    let targetColor = event.target.classList;
    if (targetColor.contains('color')) {
        filterTickets(event);
    }
  });

  let mainCont = query('.main-cont');
  mainCont.addEventListener('dragstart', dragStartEventHandler);
  mainCont.addEventListener('dragover', (event) => event.preventDefault());
  mainCont.addEventListener('dragend', dragEndEventHandler);
  mainCont.addEventListener('drop', dropEventHandler);
};

const intiKanbanBoard = () => {
    taskArr = getTicketsFromLocalStorage();
    renderTickets(taskArr);
    setupEventListener();
};

// init Kanban board
intiKanbanBoard();
