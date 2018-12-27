import {section, div, button, progress, input, span} from '@cycle/dom';

const sectionStyle = {
  marginBottom: '10px',
};

const dropareaStyle = {
  fontFamily: 'Helvetica, Arial, STHeiti, sans-serif',
  fontSize: '14px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
  margin: 'auto',
  zIndex: '999',
  width: `350px`,
  backgroundColor: 'white',
  padding: '20px',
};

const flexCenterStyle = {
  display: 'flex',
  justifyContent: 'center',
};

const inputFormStyle = {
  width: '100%',
  height: '200px',
  opacity: '0',
};
const progressBarStyle = {
  width: '100%',
};

const listItemStyle = {
  lineHeight: '20px',
  textAlign: 'center',
};

const statusStyle = {
  textAlign: 'center',
};

export default function view(stateStream) {
  return stateStream.map(function(state) {
    const {files, status, loaded, dragging, size} = state;

    let backgroundColor = 'rgb(239, 239, 239)';

    if (dragging) {
      backgroundColor = '#ffd700';
    } else if (size > 0) {
      backgroundColor = '#ccc';
    } else {
      backgroundColor = 'rgb(239, 239, 239)';
    }
    return div(
      '#droparea',
      {
        style: {
          ...dropareaStyle,
          backgroundColor,
        },
      },
      [
        section(
          {
            style: sectionStyle,
          },
          [
            div(
              {
                style: statusStyle,
              },
              [span(`Status: ${status}`)]
            ),
          ]
        ),
        div(
          {
            style: sectionStyle,
          },
          [
            input('#form-file-input', {
              style: inputFormStyle,
              attrs: {
                type: 'file',
                name: 'files',
              },
            }),
            section(
              {
                style: {
                  ...sectionStyle,
                  display: size > 0 ? 'block' : 'none',
                },
              },
              [
                section(
                  {
                    style: sectionStyle,
                  },
                  [renderList(files)]
                ),
                section(
                  {
                    style: sectionStyle,
                  },
                  [
                    progress({
                      style: progressBarStyle,
                      attrs: {
                        value: loaded,
                        max: size,
                      },
                    }),
                  ]
                ),
                section(
                  {
                    style: {
                      ...sectionStyle,
                      ...flexCenterStyle,
                    },
                  },
                  [button('#upload-button', ['upload files'])]
                ),
              ]
            ),
          ]
        ),
      ]
    );
  });
}

function renderList(rows) {
  return div(
    rows.map(item => {
      const {name} = item;
      return div(
        '.list-item',
        {
          style: listItemStyle,
        },
        [span('.list-item-name', name)]
      );
    })
  );
}
