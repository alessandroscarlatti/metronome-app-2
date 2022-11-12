import "./styles.css";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState
} from "react";
import produce from "immer";

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

let performances = {
  performances: [
    {
      name: "performance 1",
      id: "a",
      tempo: 72,
      notes: "notes 1"
    },
    {
      name: "performance 2",
      id: "b",
      tempo: 72,
      notes: "notes 2"
    },
    {
      name: "performance 3",
      id: "c",
      tempo: 72,
      notes: "notes 3"
    }
  ],
  selectedPerformanceId: "c",
  performanceActive: false,
  showSetTempo: false,
  exportViewVisible: false,
  importViewVisible: false
};

export default function App() {
  let performance = {
    id: "d",
    name: "performance 4"
  };

  return (
    <div className="App">
      <PerformancesProvider>
        <PerformanceList />
        <PerformanceViewOrNothing performance={performance} />
      </PerformancesProvider>
    </div>
  );
}

const PerformancesContext = createContext();
const PerformancesDispatchContext = createContext();

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

function performancesReducer(performances, action) {
  switch (action.type) {
    case "add": {
      return produce(performances, (performances) => {
        performances.performances.push(action.performance);
      });
    }
    case "delete": {
      return produce(performances, (performances) => {
        performances.performances = performances.performances.filter(
          (performance) => {
            return performance.id !== action.performanceId;
          }
        );

        if (performances.selectedPerformanceId === action.performanceId) {
          performances.selectedPerformanceId = null;
          performances.performanceActive = false;
        }
      });
    }
    case "deleteAll": {
      return produce(performances, (performances) => {
        performances.performances = [];

        performances.selectedPerformanceId = null;
        performances.performanceActive = false;
      });
    }
    case "setPerformanceName": {
      return produce(performances, (performances) => {
        const performance = performances.performances.filter(
          (performance) => performance.id === action.performanceId
        )[0];

        performance.name = action.name;
      });
    }
    case "move": {
      return produce(performances, (performances) => {
        let i = 0;
        for (let performance of performances.performances) {
          if (performance.id === action.performanceId) {
            break;
          }

          i++;
        }

        let target = i + action.increment;

        try {
          moveItem(performances.performances, i, target);
        } catch (e) {
          console.error("error moving item from " + i + " to " + target, e);
        }
      });
    }
    case "open": {
      return produce(performances, (performances) => {
        performances.selectedPerformanceId = action.performanceId;
        performances.performanceActive = false;
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
      return produce(performances, (performances) => {
        const performance = performances.performances.filter(
          (performance) => performance.id === action.performanceId
        )[0];

        performance.tempo += Number(action.increment);
      });
    }
    case "setTempo": {
      return produce(performances, (performances) => {
        const performance = performances.performances.filter(
          (performance) => performance.id === action.performanceId
        )[0];

        performance.tempo = Number(action.tempo);
      });
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
      return produce(performances, (performances) => {
        const performance = performances.performances.filter(
          (performance) => performance.id === action.performanceId
        )[0];

        performance.notes = action.notes;
      });
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
    case "import": {
      return produce(performances, (performances) => {
        performances.performances = action.performances;
      });
    }
    default: {
      return performances;
    }
  }
}

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

function PerformanceList() {
  let performances = usePerformances();

  let PerformanceListItems = performances.performances.map((performance) => {
    return (
      <PerformanceListItem key={performance.id} performance={performance} />
    );
  });

  return (
    <div>
      <PerformancesToolbar />
      {performances.exportViewVisible && <ExportView />}
      {performances.importViewVisible && <ImportView />}
      {PerformanceListItems}
      <PerformanceAddListItem />
    </div>
  );
}

function PerformancesToolbar() {
  let performances = usePerformances();
  let dispatch = usePerformancesDispatch();

  return (
    <div>
      <button
        onClick={() => {
          let confirmation = window.confirm(
            "Are you sure you want to delete all performances?"
          );

          if (confirmation) {
            dispatch({
              type: "deleteAll"
            });
          }
        }}
      >
        Delete All
      </button>
      <button
        onClick={() => {
          dispatch({
            type: "toggleExportView",
            exportViewVisible: true
          });
        }}
      >
        Export
      </button>
      <button
        onClick={() => {
          dispatch({
            type: "toggleImportView",
            importViewVisible: true
          });
        }}
      >
        Import
      </button>
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
    <div>
      <input readOnly value={performance.name} />
      <button
        onClick={() =>
          dispatch({
            type: "open",
            performanceId: performance.id
          })
        }
      >
        Open
      </button>
      <button
        onClick={() => {
          setEditing(true);
        }}
      >
        Edit
      </button>
    </div>
  );
}

function PerformanceListItemEditMode({ performance, setEditing }) {
  let [performanceName, setPerformanceName] = useState(performance.name);
  let dispatch = usePerformancesDispatch();

  return (
    <div>
      <input
        value={performanceName}
        onChange={(e) => setPerformanceName(e.target.value)}
      />

      <button
        onClick={() => {
          dispatch({
            type: "move",
            performanceId: performance.id,
            increment: -1
          });
        }}
      >
        Move Up
      </button>
      <button
        onClick={() => {
          dispatch({
            type: "move",
            performanceId: performance.id,
            increment: 1
          });
        }}
      >
        Move Down
      </button>
      <button
        onClick={(e) => {
          dispatch({
            type: "setPerformanceName",
            performanceId: performance.id,
            name: performanceName
          });
          setEditing(false);
        }}
      >
        Save
      </button>
      <button
        onClick={() => {
          const response = window.confirm(
            "Are you sure you want to delete this performance?"
          );

          if (response) {
            dispatch({
              type: "delete",
              performanceId: performance.id
            });
          }
        }}
      >
        Delete
      </button>
      <button onClick={(e) => setEditing(false)}>Cancel</button>
    </div>
  );
}

function PerformanceAddListItem() {
  let dispatch = usePerformancesDispatch();

  let [performanceName, setPerformanceName] = useState("");

  let addDisabled = performanceName.trim() === "";

  return (
    <div>
      <input
        value={performanceName}
        onChange={(e) => setPerformanceName(e.target.value)}
      />
      <button
        disabled={addDisabled}
        onClick={() => {
          dispatch({
            type: "add",
            performance: {
              name: performanceName,
              id: new Date().toISOString(),
              tempo: 42,
              notes: ""
            }
          });
          setPerformanceName("");
        }}
      >
        Add
      </button>
    </div>
  );
}

function PerformanceViewOrNothing() {
  let performance = useSelectedPerformance();

  return (
    <div>
      {performance == null ? (
        <button>No performance selected</button>
      ) : (
        <PerformanceView performance={performance} />
      )}
    </div>
  );
}

function PerformanceView({ performance }) {
  let dispatch = usePerformancesDispatch();
  let performances = usePerformances();

  let nextDisabled = performances.performances.length === 1;
  let previousDisabled = performances.performances.length === 1;

  return (
    <div>
      <div>
        <button
          disabled={previousDisabled}
          onClick={() => {
            dispatch({
              type: "previous",
              performanceId: performance.id
            });
          }}
        >
          Previous
        </button>
        <span>{performance.name}</span>
        <button
          disabled={nextDisabled}
          onClick={() => {
            dispatch({
              type: "next",
              performanceId: performance.id
            });
          }}
        >
          Next
        </button>
      </div>
      <div>
        <PerformanceNotes performance={performance} />
      </div>
      <div>Tempo: {performance.tempo}</div>
      <div>
        {performances.performanceActive ? (
          <ActivePerformance performance={performance} />
        ) : (
          <InactivePerformance performance={performance} />
        )}
      </div>
      <StartStopButton />

      {/* <ShowSetTempoButton performance={performance} /> */}

      {/* {performances.showSetTempo && <SetTempoView performance={performance} />} */}
      <SetTempoView performance={performance} />
      <div>
        <button
          onClick={() => {
            dispatch({
              type: "close",
              performanceId: performance.id
            });
          }}
        >
          Close Performance
        </button>
      </div>
    </div>
  );
}

// function ShowSetTempoButton() {
//   let dispatch = usePerformancesDispatch();

//   return (
//     <button
//       onClick={() => {
//         dispatch({
//           type: "showSetTempo"
//         });
//       }}
//     >
//       Set Tempo
//     </button>
//   );
// }

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
    <button
      onClick={() => {
        dispatch({ type: "start", performanceId: performance.id });
      }}
    >
      Start
    </button>
  );
}

function StopButton() {
  let dispatch = usePerformancesDispatch();

  return (
    <button
      onClick={() => {
        dispatch({ type: "stop" });
      }}
    >
      Stop
    </button>
  );
}

function IncrementButtons({ performance }) {
  let dispatch = usePerformancesDispatch();

  return (
    <span>
      <button
        onClick={() => {
          dispatch({
            type: "incrementTempo",
            performanceId: performance.id,
            increment: 1
          });
        }}
      >
        Up
      </button>

      <button
        onClick={() => {
          dispatch({
            type: "incrementTempo",
            performanceId: performance.id,
            increment: -1
          });
        }}
      >
        Down
      </button>
    </span>
  );
}

function SetTempoView({ performance }) {
  let dispatch = usePerformancesDispatch();

  let [tempo, setTempo] = useState(performance.tempo);

  useEffect(() => {
    setTempo(performance.tempo);
  }, [performance.id, performance.tempo]);

  return (
    <div>
      <div>Set Tempo View</div>
      <TapTempoInput tempo={tempo} setTempo={setTempo} />
      <TypeTempoInput
        performance={performance}
        tempo={tempo}
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

      <button
        onClick={() => {
          dispatch({
            type: "setTempo",
            performanceId: performance.id,
            tempo: tempo
          });
          // dispatch({
          //   type: "hideSetTempo"
          // });
        }}
      >
        Set Tempo
      </button>
    </div>
  );
}

function TypeTempoInput({ performance, tempo, setTempo }) {
  // let [tempo, setTempo] = useState(performance.tempo);

  return (
    <span>
      <input
        type="number"
        onChange={(e) => setTempo(e.target.value)}
        value={tempo}
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
    <button
      onClick={() => {
        console.log("tap tempo");
        handleTap();
      }}
    >
      Tap Tempo
    </button>
  );
}

function ActivePerformance({ performance }) {
  const tickRef = useRef();

  const tick = () => {
    try {
      if (tickRef.current != null) {
        tickRef.current.style.fontWeight = "bold";
      }
    } catch (e) {
      console.error("error in tick", e);
    }

    setTimeout(() => {
      try {
        if (tickRef.current != null) {
          tickRef.current.style.fontWeight = "normal";
        }
      } catch (e) {
        console.error("error in tick", e);
      }
    }, 50);
  };

  useEffect(() => {
    let interval = setInterval(() => {
      console.log("tick");
      tick();
    }, calculateIntervalMs(performance.tempo));

    return () => {
      clearInterval(interval);
    };
  }, [performance.tempo]);

  return (
    <div>
      <div ref={tickRef}>tick</div>
    </div>
  );
}

function InactivePerformance({ performance }) {
  return <div>...</div>;
}

function PerformanceNotes({ performance }) {
  let [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [performance.id]);

  return editing ? (
    <PerformanceNotesEditMode
      performance={performance}
      setEditing={setEditing}
    />
  ) : (
    <PerformanceNotesViewMode
      performance={performance}
      setEditing={setEditing}
    />
  );
}

function PerformanceNotesViewMode({ performance, setEditing }) {
  return (
    <div>
      <div>
        <textarea readOnly value={performance.notes}></textarea>
      </div>
      <div>
        <button onClick={(e) => setEditing(true)}>Edit</button>
      </div>
    </div>
  );
}

function PerformanceNotesEditMode({ performance, setEditing }) {
  let dispatch = usePerformancesDispatch();

  let [notes, setNotes] = useState(performance.notes);

  return (
    <div>
      <div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
      </div>
      <div>
        <button
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
        </button>
        <button onClick={(e) => setEditing(false)}>Cancel</button>
      </div>
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
      <div>
        <textarea readOnly ref={ref} value={json}>
          {"{json}"}
        </textarea>
      </div>
      <button onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
      <button
        onClick={() => {
          dispatch({
            type: "toggleExportView",
            exportViewVisible: false
          });
        }}
      >
        Close
      </button>
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
      <div>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
        ></textarea>
      </div>
      <button
        onClick={() => {
          try {
            let performances = JSON.parse(json);

            dispatch({
              type: "import",
              performances: performances
            });
          } catch (e) {
            console.error("Error parsing JSON", e);
            window.alert("Error parsing JSON: " + e);
          }
        }}
      >
        Import
      </button>
      <button
        onClick={() => {
          dispatch({
            type: "toggleImportView",
            importViewVisible: false
          });
        }}
      >
        Close
      </button>
    </div>
  );
}
