const protobuf = require('protobufjs');
const path = require('path');

const loadProtobufs = () => {
    const root = new protobuf.Root();
    const protoPath = path.join(__dirname, 'protobufs');
    
    // load all proto files with correct paths
    root.loadSync(path.join(protoPath, 'login5.proto'), {
        keepCase: true,
        alternateCommentMode: true,
        includeDirs: [protoPath] // this tells protobuf to look for imports relative to this dir
    });

    return root;
};

module.exports = { loadProtobufs }; 