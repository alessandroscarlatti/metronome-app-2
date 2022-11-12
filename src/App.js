import "./styles.css";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import produce from "immer";

// todo how to continue the "mocking" process WITH bootstrap styles
// I find that seeing the styling makes me stop seeing behavior
// and makes me start seeing "finish"
// todo build out the navbar design
// todo the difficulty of finding the visual component in the code
// what is it called?
// I can't just search for "tempo", because
// that is a property that is used in many places
//
// the challenge is that when doing the steps of development on a working application
// i have to try to develop it while still being able to use the app
// but the initial steps of dev require me to make the app look bad
// so...that motivates me to skip dev steps...
// how do we beat that?
// it's related to how i build out a java feature while still
// letting everything compile
// then eventually i wire it in
// can that be done here?
// almost like feature flags...
// ...approach 1 = wrap a component in a <Feature> component?
// ...approach 2 = use plain html components
// ...approach 3 =
//
// the test here is on adding the edit performance name feature
// to the performance view
// we are going to take approach 2
// 3 phases:
// 1. sketch phase
// 2. wiring phase
// 3. styling phase

function calculateIntervalMs(bpm) {
  if (bpm <= 0) {
    // don't allow div 0, or negative tempos
    // so just use 42 by default
    return 42;
  } else {
    return 60000 / bpm;
  }
}

function calculateBpm(intervalMs) {
  if (intervalMs <= 0) {
    // don't allow div 0, or negative tempos
    // so just use 42 by default
    return 42;
  } else {
    return 60000 / intervalMs;
  }
}

function moveItem(data, from, to) {
  // remove `from` item and store it
  var f = data.splice(from, 1)[0];
  // insert stored item into position `to`
  data.splice(to, 0, f);
}

function findPerformanceIndex(performances, performanceId) {
  for (let i = 0; i < performances.length; i++) {
    if (performances[i].id === performanceId) {
      return i;
    }
  }

  return null;
}

const defaultPerformances = {
  performances: [
    {
      name: "performance 1",
      id: "a",
      tempo: 72,
      notes: "notes 1",
    },
    {
      name: "performance 2",
      id: "b",
      tempo: 72,
      notes: "notes 2",
    },
    {
      name: "performance 3",
      id: "c",
      tempo: 72,
      notes: "notes 3",
    },
  ],
  selectedPerformanceId: "c",
  performanceActive: false,
  showSetTempo: false,
  exportViewVisible: false,
  importViewVisible: false,
  mainPanelView: "performancesList",
  editingPerformance: false,
};

function savePerformances(performances) {
  localStorage.setItem("app.performances", JSON.stringify(performances));

  return performances;
}

function loadPerformances() {
  let performancesJson = localStorage.getItem("app.performances");

  if (performancesJson != null) {
    return JSON.parse(performancesJson);
  } else {
    return defaultPerformances;
  }
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

let performances = loadPerformances();

function performancesReducer(performances, action) {
  switch (action.type) {
    case "add": {
      return savePerformances(
        produce(performances, (performances) => {
          performances.performances.push(action.performance);
        })
      );
    }
    case "delete": {
      return savePerformances(
        produce(performances, (performances) => {
          performances.performances = performances.performances.filter(
            (performance) => {
              return performance.id !== action.performanceId;
            }
          );

          if (performances.selectedPerformanceId === action.performanceId) {
            performances.selectedPerformanceId = null;
            performances.performanceActive = false;
          }
        })
      );
    }
    case "deleteAll": {
      return savePerformances(
        produce(performances, (performances) => {
          performances.performances = [];

          performances.selectedPerformanceId = null;
          performances.performanceActive = false;
        })
      );
    }
    case "setPerformanceName": {
      return savePerformances(
        produce(performances, (performances) => {
          const performance = performances.performances.filter(
            (performance) => performance.id === action.performanceId
          )[0];

          performance.name = action.name;
        })
      );
    }
    case "move": {
      return savePerformances(
        produce(performances, (performances) => {
          let i = 0;
          for (let performance of performances.performances) {
            if (performance.id === action.performanceId) {
              break;
            }

            i++;
          }

          let target = i + action.increment;

          if (target !== -1 && target < performances.performances.length) {
            // don't allow to move past beginning of list
            // don't allow to move pas end of list
            try {
              moveItem(performances.performances, i, target);
            } catch (e) {
              console.error("error moving item from " + i + " to " + target, e);
            }
          }
        })
      );
    }
    case "open": {
      return produce(performances, (performances) => {
        performances.selectedPerformanceId = action.performanceId;
        performances.performanceActive = false;
        performances.mainPanelView = "performance";
      });
    }
    case "close": {
      return produce(performances, (performances) => {
        performances.selectedPerformanceId = null;
        performances.performanceActive = false;
      });
    }
    case "previous": {
      return produce(performances, (performances) => {
        let i = 0;
        for (let performance of performances.performances) {
          if (performance.id === action.performanceId) {
            break;
          }

          i++;
        }

        let targetIndex = i - 1;

        if (i <= 0) {
          // we are at the beginning of the list, so go to the end
          targetIndex =
            performances.performances.length === 0
              ? null
              : performances.performances.length - 1;
        }

        performances.selectedPerformanceId =
          targetIndex == null
            ? null
            : performances.performances[targetIndex].id;

        performances.performanceActive = false;
        performances.editingPerformance = false;
      });
    }
    case "next": {
      return produce(performances, (performances) => {
        let i = 0;
        for (let performance of performances.performances) {
          if (performance.id === action.performanceId) {
            break;
          }

          i++;
        }

        let targetIndex = i + 1;

        if (i >= performances.performances.length - 1) {
          // we are at the end of the list, so go to the beginning
          targetIndex = performances.performances.length === 0 ? null : 0;
        }

        performances.selectedPerformanceId =
          targetIndex == null
            ? null
            : performances.performances[targetIndex].id;

        performances.performanceActive = false;
        performances.editingPerformance = false;
      });
    }
    case "start": {
      return produce(performances, (performances) => {
        performances.performanceActive = true;
      });
    }
    case "stop": {
      return produce(performances, (performances) => {
        performances.performanceActive = false;
      });
    }
    case "incrementTempo": {
      return savePerformances(
        produce(performances, (performances) => {
          const performance = performances.performances.filter(
            (performance) => performance.id === action.performanceId
          )[0];

          performance.tempo += Number(action.increment);
        })
      );
    }
    case "setTempo": {
      return savePerformances(
        produce(performances, (performances) => {
          const performance = performances.performances.filter(
            (performance) => performance.id === action.performanceId
          )[0];

          if (action.tempo > 300) {
            performance.tempo = 42;
          } else {
            performance.tempo = Math.round(Number(action.tempo));
          }
        })
      );
    }
    case "showSetTempo": {
      return produce(performances, (performances) => {
        performances.showSetTempo = true;
      });
    }
    case "hideSetTempo": {
      return produce(performances, (performances) => {
        performances.showSetTempo = false;
      });
    }
    case "setNotes": {
      return savePerformances(
        produce(performances, (performances) => {
          const performance = performances.performances.filter(
            (performance) => performance.id === action.performanceId
          )[0];

          performance.notes = action.notes;
        })
      );
    }
    case "toggleImportView": {
      return produce(performances, (performances) => {
        performances.importViewVisible = action.importViewVisible;
        performances.exportViewVisible = false;
      });
    }
    case "toggleExportView": {
      return produce(performances, (performances) => {
        performances.exportViewVisible = action.exportViewVisible;
        performances.importViewVisible = false;
      });
    }
    case "toggleAppMainPanelView": {
      return produce(performances, (performances) => {
        performances.mainPanelView = action.appMainPanelView;
        performances.editingPerformance = false;
        performances.performanceActive = false;
      });
    }
    case "import": {
      return savePerformances(
        produce(performances, (performances) => {
          performances.performances = action.performances;
        })
      );
    }
    case "toggleEditingPerformance": {
      return produce(performances, (performances) => {
        performances.editingPerformance = action.editingPerformance;
      });
    }
    default: {
      return performances;
    }
  }
}

const PerformancesContext = createContext();
const PerformancesDispatchContext = createContext();

function usePerformances() {
  return useContext(PerformancesContext);
}

function usePerformancesDispatch() {
  return useContext(PerformancesDispatchContext);
}

function useSelectedPerformance() {
  const performances = usePerformances();

  for (let performance of performances.performances) {
    if (performance.id === performances.selectedPerformanceId) {
      return performance;
    }
  }

  return null;
}

function PerformancesProvider({ children }) {
  const [performances2, dispatch] = useReducer(
    performancesReducer,
    performances
  );

  return (
    <PerformancesContext.Provider value={performances2}>
      <PerformancesDispatchContext.Provider value={dispatch}>
        {children}
      </PerformancesDispatchContext.Provider>
    </PerformancesContext.Provider>
  );
}

function Button(props) {
  let className = "btn";

  let variant = props.variant != null ? props.variant : "light";

  className += " btn-" + variant;

  return (
    <button className={className} {...props}>
      {props.children}
    </button>
  );
}

const Input = forwardRef((props, ref) => {
  return <input ref={ref} className="form-control" {...props} />;
});

const TextArea = forwardRef((props, ref) => {
  let internalRef = useRef();

  if (ref == null) {
    // a forward ref was not provided
    // so use internal ref
    ref = internalRef;
  }

  useEffect(() => {
    ref.current.style.height = 0;
    ref.current.style.height = ref.current.scrollHeight + "px";
    ref.current.style.overflowY = props.maxHeight != null ? "scroll" : "hidden";
    ref.current.style.maxHeight =
      props.maxHeight != null ? props.maxHeight + "rem" : null;
  }, [ref, props.value, props.maxHeight]);

  const onInput = useCallback(() => {
    ref.current.style.height = 0;
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, [ref]);

  return (
    <textarea
      ref={ref}
      onInput={onInput}
      className="form-control"
      {...props}
    ></textarea>
  );
});

export default function App() {
  return (
    <div className="App">
      <PerformancesProvider>
        {/* <PerformanceList />
        <PerformanceViewOrNothing performance={performance} /> */}
        <AppToolbarAndMainPanelView />
      </PerformancesProvider>
    </div>
  );
}

function AppToolbarAndMainPanelView() {
  return (
    <div className="mb-5">
      <AppToolbar />
      {/* <hr className="mt-2 mb-2" /> */}
      <AppMainPanelView />
    </div>
  );
}

function AppToolbar() {
  let dispatch = usePerformancesDispatch();
  let performances = usePerformances();

  return (
    <div className="p-2 pt-3 bg-light">
      <Button
        variant="link"
        style={{
          fontWeight:
            performances.mainPanelView === "performancesList"
              ? "bold"
              : "initial",
        }}
        onClick={() => {
          dispatch({
            type: "toggleAppMainPanelView",
            appMainPanelView: "performancesList",
          });
        }}
      >
        Performance List
      </Button>
      <Button
        variant="link"
        style={{
          fontWeight:
            performances.mainPanelView === "performance" ? "bold" : "initial",
        }}
        onClick={() => {
          dispatch({
            type: "toggleAppMainPanelView",
            appMainPanelView: "performance",
          });
        }}
      >
        Performance
      </Button>
    </div>
  );
}

function AppMainPanelView() {
  let performances = usePerformances();

  return (
    <div>
      {performances.mainPanelView === "performancesList" && <PerformanceList />}
      {performances.mainPanelView === "performance" && (
        <PerformanceViewOrNothing />
      )}
    </div>
  );
}

function PerformancesToolbar() {
  let performances = usePerformances();
  let dispatch = usePerformancesDispatch();

  let [open, setOpen] = useState(true);

  return (
    <div className="d-flex justify-content-end gap-2 my-3 mx-2">
      {open && (
        <div className="d-flex justify-content-center gap-2">
          <Button
            onClick={() => {
              dispatch({
                type: "toggleExportView",
                exportViewVisible: true,
              });
            }}
          >
            Export
          </Button>
          <Button
            onClick={() => {
              dispatch({
                type: "toggleImportView",
                importViewVisible: true,
              });
            }}
          >
            Import
          </Button>
          <Button
            onClick={() => {
              let confirmation = window.confirm(
                "Are you sure you want to delete all performances?"
              );

              if (confirmation) {
                dispatch({
                  type: "deleteAll",
                });
              }
            }}
          >
            Delete All
          </Button>
        </div>
      )}

      {/* <div>
        <Button
          onClick={() => {
            setOpen(!open);
          }}
        >
          ...
        </Button>
      </div> */}
    </div>
  );
}

function PerformanceList() {
  let performances = usePerformances();

  let PerformanceListItems = performances.performances.map((performance) => {
    return (
      // <li
      //   key={performance.id}
      //   class="list-group-item _list-group-item-action"
      //   style={{ cursor: "pointer" }}
      // >
      <PerformanceListItem key={performance.id} performance={performance} />
      // </li>
    );
  });

  return (
    <div>
      <div className="m-2">
        <PerformancesToolbar />
      </div>
      {performances.exportViewVisible && (
        <div className="mb-3">
          <ExportView />
        </div>
      )}
      {performances.importViewVisible && (
        <div className="mb-3">
          <ImportView />
        </div>
      )}
      <div className="m-3">
        <PerformanceAddListItem />
      </div>
      <ul className="list-group">
        {/* <li className="list-group-item">
          <PerformanceAddListItem />
        </li> */}
        {PerformanceListItems}
      </ul>
    </div>
  );
}

function PerformanceListItem({ performance }) {
  let [editing, setEditing] = useState(false);

  return editing ? (
    <PerformanceListItemEditMode
      performance={performance}
      setEditing={setEditing}
    />
  ) : (
    <PerformanceListItemViewMode
      performance={performance}
      setEditing={setEditing}
    />
  );
}

function PerformanceListItemViewMode({ performance, setEditing }) {
  let dispatch = usePerformancesDispatch();

  return (
    <li
      class="list-group-item list-group-item-action"
      style={{ cursor: "pointer" }}
    >
      <div
        className="d-flex align-items-baseline gap-2"
        onClick={() => {
          dispatch({
            type: "open",
            performanceId: performance.id,
          });
        }}
      >
        <span className="flex-grow-1">{performance.name}</span>
        {/* <Button
        onClick={() =>
          dispatch({
            type: "open",
            performanceId: performance.id
          })
        }
      >
        Open
      </Button> */}
        <Button
          onClick={(e) => {
            setEditing(true);
            e.stopPropagation();
          }}
        >
          Edit
        </Button>
      </div>
    </li>
  );
}

function PerformanceListItemEditMode({ performance, setEditing }) {
  let [performanceName, setPerformanceName] = useState(performance.name);
  let dispatch = usePerformancesDispatch();

  let performanceNameInputRef = useRef();

  useEffect(() => {
    performanceNameInputRef.current.select();
    performanceNameInputRef.current.focus();
  }, []);

  const save = () => {
    dispatch({
      type: "setPerformanceName",
      performanceId: performance.id,
      name: performanceName,
    });
    setEditing(false);
  };

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        save();
      }
    },
    [save]
  );

  return (
    <li class="list-group-item">
      <div className="">
        <div>
          <Input
            value={performanceName}
            ref={performanceNameInputRef}
            placeholder="performance name"
            onChange={(e) => setPerformanceName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="d-flex justify-content-end gap-2 mt-2 mb-2">
          <Button
            onClick={() => {
              dispatch({
                type: "move",
                performanceId: performance.id,
                increment: -1,
              });
            }}
          >
            Move Up
          </Button>
          <Button
            onClick={() => {
              dispatch({
                type: "move",
                performanceId: performance.id,
                increment: 1,
              });
            }}
          >
            Move Down
          </Button>

          <Button
            onClick={() => {
              const response = window.confirm(
                "Are you sure you want to delete this performance?"
              );

              if (response) {
                dispatch({
                  type: "delete",
                  performanceId: performance.id,
                });
              }
            }}
          >
            Delete
          </Button>
          <Button onClick={(e) => setEditing(false)}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </li>
  );
}

function PerformanceAddListItem() {
  let dispatch = usePerformancesDispatch();

  let [performanceName, setPerformanceName] = useState("");

  let addDisabled = performanceName.trim() === "";

  const addPerformance = useCallback(() => {
    dispatch({
      type: "add",
      performance: {
        name: performanceName,
        id: new Date().toISOString(),
        tempo: 42,
        notes: "",
      },
    });
    setPerformanceName("");
  }, [dispatch, performanceName, setPerformanceName]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        addPerformance();
      }
    },
    [addPerformance]
  );

  return (
    <div className="d-flex gap-2">
      <Input
        value={performanceName}
        placeholder=""
        onChange={(e) => setPerformanceName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button variant="primary" disabled={addDisabled} onClick={addPerformance}>
        Add
      </Button>
    </div>
  );
}

function PerformanceViewOrNothing() {
  let performance = useSelectedPerformance();

  return (
    <div>
      {performance == null ? (
        <div>No performance selected</div>
      ) : (
        <PerformanceView performance={performance} />
      )}
    </div>
  );
}

const Dot = forwardRef(({ size = 1, variant = "primary", ...rest }, ref) => {
  let style = {
    height: size + "rem",
    width: size + "rem",
    borderRadius: "50%",
    backgroundColor: `var(--bs-${variant})`,
    // transition: "opacity 0.1s",
    transition: "opacity 0.1s, background-color 0.1s, background 0.1s",
    cursor: rest.onClick != null ? "pointer" : null,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  let className = "dot";

  return <div ref={ref} className={className} style={style} {...rest}></div>;
});

function usePerformanceDetails(performance) {
  let [name, setName] = useState(performance.name);
  let [notes, setNotes] = useState(performance.notes);
  let performances = usePerformances();
  let dispatch = usePerformancesDispatch();

  useEffect(() => {
    setName(performance.name);
    setNotes(performance.notes);
  }, [performance.name, performance.notes, performances.editingPerformance]);

  return {
    name,
    setName,
    notes,
    setNotes,
    save() {
      dispatch({
        type: "setNotes",
        performanceId: performance.id,
        notes: notes,
      });
      dispatch({
        type: "setPerformanceName",
        performanceId: performance.id,
        name: name,
      });
    },
  };
}

function PerformanceView({ performance }) {
  let performanceDetails = usePerformanceDetails(performance);

  return (
    <div>
      <PerformanceTitleToolbar performance={performance} />
      <PerformanceTitle performance={performance} {...performanceDetails} />
      <PerformanceNotes performance={performance} {...performanceDetails} />
      <PerformanceEditToolbar {...performanceDetails} />
      <PerformanceMetronomeView performance={performance} />
    </div>
  );
}

function PerformanceTitleToolbar({ performance }) {
  let performances = usePerformances();

  let flexStyle = {
    justifyContent: "space-between",
  };

  let performanceNumber =
    findPerformanceIndex(performances.performances, performance.id) + 1;
  let totalPerformances = performances.performances.length;

  return (
    <div className="d-flex m-3 align-items-baseline" style={flexStyle}>
      <PreviousPerformanceButton />

      <div>
        <div className="lead">{performance.name}</div>
        <div>
          <small className="text-muted">
            {performanceNumber}/{totalPerformances}
          </small>
        </div>
      </div>
      <NextPerformanceButton />
    </div>
  );
}

function PreviousPerformanceButton() {
  let dispatch = usePerformancesDispatch();
  let performances = usePerformances();

  let previousDisabled = performances.performances.length === 1;

  return (
    <Button
      disabled={previousDisabled}
      onClick={() => {
        dispatch({
          type: "previous",
          performanceId: performances.selectedPerformanceId,
        });
      }}
    >
      Previous
    </Button>
  );
}

function NextPerformanceButton() {
  let dispatch = usePerformancesDispatch();
  let performances = usePerformances();

  let nextDisabled = performances.performances.length === 1;

  return (
    <Button
      disabled={nextDisabled}
      onClick={() => {
        dispatch({
          type: "next",
          performanceId: performances.selectedPerformanceId,
        });
      }}
    >
      Next
    </Button>
  );
}

function PerformanceTitle({ performance, name, setName }) {
  let performances = usePerformances();

  if (performances.editingPerformance) {
    return (
      <div className="m-3">
        <Input
          value={name}
          placeholder="name"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    );
  } else {
    return null;
    // return <div className="lead mt-3">{performance.name}</div>;
  }
}

function PerformanceNotes({ performance, notes, setNotes }) {
  // let [editing, setEditing] = useState(false);
  let performances = usePerformances();
  // let dispatch = usePerformancesDispatch();

  let editing = performances.editingPerformance;

  // const setEditing = useCallback(
  //   (editing) => {
  //     dispatch({
  //       type: "toggleEditingPerformance",
  //       editingPerformance: editing
  //     });
  //   },
  //   [dispatch]
  // );

  // useEffect(() => {
  //   setEditing(false);
  // }, [performance.id, setEditing]);

  return editing ? (
    <PerformanceNotesEditMode
      performance={performance}
      {...{ notes, setNotes }}
      // setEditing={setEditing}
    />
  ) : (
    <PerformanceNotesViewMode
      performance={performance}
      // setEditing={setEditing}
    />
  );
}

function PerformanceNotesViewMode({ performance, setEditing }) {
  const preStyle = {
    fontFamily: "inherit",
    fontSize: "inherit",
    textAlign: "left",
  };

  return (
    <div className="d-flex gap-2 align-items-end m-3">
      <div className="flex-grow-1">
        {/* <pre style={preStyle}>{performance.notes}</pre> */}
        <TextArea
          readOnly
          value={performance.notes}
          placeholder="(no notes)"
        ></TextArea>
      </div>
    </div>
  );
}

function PerformanceNotesEditMode({ performance, notes, setNotes }) {
  return (
    <div>
      <div className="m-3">
        <TextArea
          value={notes}
          placeholder="notes"
          onChange={(e) => setNotes(e.target.value)}
        ></TextArea>
      </div>
      {/* <div className="d-flex justify-content-center gap-2">
        <Button onClick={(e) => setEditing(false)}>Cancel</Button>

        <Button
          variant="primary"
          onClick={(e) => {
            dispatch({
              type: "setNotes",
              performanceId: performance.id,
              notes: notes
            });
            setEditing(false);
          }}
        >
          Save
        </Button>
      </div> */}
    </div>
  );
}

function PerformanceEditToolbar({ save }) {
  let performances = usePerformances();
  let dispatch = usePerformancesDispatch();

  if (performances.editingPerformance) {
    return (
      <div className="d-flex justify-content-end gap-2 m-3">
        <Button
          onClick={() => {
            dispatch({
              type: "toggleEditingPerformance",
              editingPerformance: false,
            });
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            save();
            dispatch({
              type: "toggleEditingPerformance",
              editingPerformance: false,
            });
          }}
        >
          Save
        </Button>
      </div>
    );
  } else {
    return (
      <div className="d-flex justify-content-end gap-2 m-3">
        <Button
          onClick={() => {
            dispatch({
              type: "toggleEditingPerformance",
              editingPerformance: true,
            });
          }}
        >
          Edit
        </Button>
      </div>
    );
  }
}

function PerformanceMetronomeView({ performance }) {
  let performances = usePerformances();

  return (
    <div>
      <div className="lead">Tempo {performance.tempo}</div>
      <div>
        {performances.performanceActive ? (
          <ActiveMetronome performance={performance} />
        ) : (
          <InactiveMetronome performance={performance} />
        )}
      </div>
      {/* <StartStopButton /> */}
      <div className="mt-4">
        <SetTempoView performance={performance} />
      </div>
    </div>
  );
}

function StartStopButton() {
  let performances = usePerformances();

  if (performances.performanceActive) {
    return <StopButton />;
  } else {
    return <StartButton />;
  }
}

function StartButton() {
  let dispatch = usePerformancesDispatch();
  let performance = useSelectedPerformance();

  return (
    <Button
      variant="primary"
      onClick={() => {
        dispatch({ type: "start", performanceId: performance.id });
      }}
    >
      Start
    </Button>
  );
}

function StopButton() {
  let dispatch = usePerformancesDispatch();

  return (
    <Button
      variant="secondary"
      onClick={() => {
        dispatch({ type: "stop" });
      }}
    >
      Stop
    </Button>
  );
}

function IncrementButtons({ performance }) {
  let dispatch = usePerformancesDispatch();

  return (
    <>
      <Button
        onClick={() => {
          dispatch({
            type: "incrementTempo",
            performanceId: performance.id,
            increment: -1,
          });
        }}
      >
        Down
      </Button>

      <Button
        onClick={() => {
          dispatch({
            type: "incrementTempo",
            performanceId: performance.id,
            increment: 1,
          });
        }}
      >
        Up
      </Button>
    </>
  );
}

function SetTempoView({ performance }) {
  let dispatch = usePerformancesDispatch();

  let setTempo = (tempo) => {
    dispatch({
      type: "setTempo",
      performanceId: performance.id,
      tempo: tempo,
    });
  };

  return (
    <div className="d-flex justify-content-center gap-2 m-3">
      {/* <div>Set Tempo View</div> */}
      <TapTempoInput tempo={performance.tempo} setTempo={setTempo} />
      <TypeTempoInput
        performance={performance}
        tempo={performance.tempo}
        setTempo={setTempo}
      />
      <IncrementButtons performance={performance} />

      {/* <button
        onClick={(e) => {
          dispatch({
            type: "hideSetTempo"
          });
        }}
      >
        Cancel
      </button> */}

      {/* <Button
        onClick={() => {
          dispatch({
            type: "setTempo",
            performanceId: performance.id,
            tempo: performance.tempo
          });
          // dispatch({
          //   type: "hideSetTempo"
          // });
        }}
      >
        Set Tempo
      </Button> */}
    </div>
  );
}

function TypeTempoInput({ performance, tempo, setTempo }) {
  // let [tempo, setTempo] = useState(performance.tempo);

  return (
    <span>
      <Input
        type="number"
        onChange={(e) => setTempo(e.target.value)}
        value={tempo}
        style={{ width: "6rem" }}
      />
    </span>
  );
}

function TapTempoInput({ setTempo }) {
  let taps = [];
  let tapsWindowSize = 4;

  const handleTap = () => {
    taps.push(new Date() - 0);

    if (taps.length > tapsWindowSize + 1) {
      // reduce the array back down to the correct size
      // before we average the values
      taps = taps.slice(1);
    }

    // now average the values
    const tapsIntervals = taps.map((tap, i) => {
      if (i === 0) {
        return 0;
      } else {
        return tap - taps[i - 1];
      }
    });

    let avg =
      tapsIntervals.slice(1).reduce((sum, el) => sum + el, 0) /
      (tapsIntervals.length - 1);

    let bpm = Math.round(calculateBpm(avg));

    console.log("tempo bpm " + bpm, avg, taps);

    if (setTempo != null && !isNaN(bpm)) {
      setTempo(bpm);
    }
  };

  return (
    <Button
      onClick={() => {
        console.log("tap tempo");
        handleTap();
      }}
    >
      Tap
    </Button>
  );
}

function ActiveMetronome({ performance }) {
  const dispatch = usePerformancesDispatch();
  const tickRef = useRef();

  const tick = () => {
    try {
      if (tickRef.current != null) {
        // tickRef.current.style.fontWeight = "bold";
        // tickRef.current.style.visibility = "visible";
        // tickRef.current.style.opacity = "100";
        tickRef.current.style.backgroundColor = "var(--bs-primary)";
        // tickRef.current.style.background =
        //   "radial-gradient(circle, var(--bs-primary) 0%, var(--bs-light) 100%)";
      }
    } catch (e) {
      console.error("error in tick", e);
    }

    setTimeout(() => {
      try {
        if (tickRef.current != null) {
          // tickRef.current.style.fontWeight = "normal";
          // tickRef.current.style.visibility = "hidden";
          // tickRef.current.style.opacity = "0";
          tickRef.current.style.backgroundColor = "var(--bs-light)";
          // tickRef.current.style.background =
          //   "radial-gradient(circle, var(--bs-light) 0%, var(--bs-light) 100%)";
        }
      } catch (e) {
        console.error("error in tick", e);
      }
    }, 75);
  };

  useEffect(() => {
    tick();

    if (performance.tempo > 0) {
      let interval = setInterval(() => {
        tick();
      }, calculateIntervalMs(performance.tempo));

      return () => {
        clearInterval(interval);
      };
    }
  }, [performance.tempo]);

  return (
    <div>
      <div className="d-flex justify-content-center m-2">
        <Dot
          ref={tickRef}
          size={8}
          variant="light"
          onClick={() => {
            dispatch({
              type: "stop",
            });
          }}
        />
      </div>
    </div>
  );
}

function InactiveMetronome({ performance }) {
  const dispatch = usePerformancesDispatch();

  return (
    <div className="d-flex justify-content-center m-2">
      <Dot
        size={8}
        variant="light"
        onClick={() => {
          dispatch({
            type: "start",
          });
        }}
      >
        <div>Start</div>
      </Dot>
    </div>
  );
}

function ExportView() {
  let ref = useRef();
  let performances = usePerformances();
  let dispatch = usePerformancesDispatch();

  let json = JSON.stringify(performances.performances);

  let [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      let timeout = window.setTimeout(() => {
        setCopied(false);
      }, 3000);

      return () => {
        window.clearTimeout(timeout);
      };
    }
  }, [copied]);

  let copy = () => {
    console.log("Export json", ref.current.value);

    ref.current.select();
    ref.current.setSelectionRange(0, 99999); // For mobile devices

    // navigator.clipboard.writeText(ref.current.value);

    document.execCommand("copy");

    setCopied(true);
  };

  return (
    <div>
      <div className="m-3">
        <TextArea readOnly ref={ref} value={json} maxHeight={10}>
          {"{json}"}
        </TextArea>
      </div>
      <div className="d-flex justify-content-center gap-2">
        <Button
          onClick={() => {
            dispatch({
              type: "toggleExportView",
              exportViewVisible: false,
            });
          }}
        >
          Close
        </Button>
        <Button variant="primary" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function ImportView() {
  let dispatch = usePerformancesDispatch();

  let [json, setJson] = useState(
    `[{"name":"performance 1","id":"a","tempo":72,"notes":"notes 1"}]`
  );

  return (
    <div>
      <div className="m-3">
        <TextArea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          maxHeight={10}
        ></TextArea>
      </div>
      <div className="d-flex justify-content-center gap-2">
        <Button
          onClick={() => {
            dispatch({
              type: "toggleImportView",
              importViewVisible: false,
            });
          }}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            try {
              let performances = JSON.parse(json);

              dispatch({
                type: "import",
                performances: performances,
              });
            } catch (e) {
              console.error("Error parsing JSON", e);
              window.alert("Error parsing JSON: " + e);
            }
          }}
        >
          Import
        </Button>
      </div>
    </div>
  );
}
