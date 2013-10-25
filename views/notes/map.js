function(doc) {
    if (doc.type == "note") {
        emit([1], doc);   
    }
};
