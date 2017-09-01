const filesInDirectory = (dir: DirectoryEntry): Promise<File[]> => new Promise(resolve =>

  dir.createReader().readEntries(entries =>
    Promise.all(entries.filter(e => e.name[0] !== '.').map(e =>
      e.isDirectory
        ? filesInDirectory(e as DirectoryEntry)
        : new Promise(r => (e as FileEntry).file(file => r([file])))
    ))
      .then((filesArrays: File[][]) => ([] as File[]).concat(...filesArrays))
      .then(resolve)
  )
);

const timestampForFilesInDirectory = (dir: DirectoryEntry) =>
  filesInDirectory(dir).then(files =>
    files.map(f => f.name + f.lastModifiedDate).join());


const reload = () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    const tab = tabs[0];
    if (tab) {
      chrome.tabs.reload(tab.id as any)
    }

    chrome.runtime.reload()
  })
};

const watchChanges = (dir: DirectoryEntry, lastTimestamp?: string) => {

  timestampForFilesInDirectory(dir).then(timestamp => {

    if (!lastTimestamp || (lastTimestamp === timestamp)) {

      setTimeout(() => watchChanges(dir, timestamp), 1000) // retry after 1s

    } else {

      reload()
    }
  })

};

chrome.management.getSelf(self => {
  if (self.installType === 'development') {
    chrome.runtime.getPackageDirectoryEntry((dir: DirectoryEntry) => watchChanges(dir))
  }
});
