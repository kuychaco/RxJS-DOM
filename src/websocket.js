   /**
   * Creates a WebSocket Subject with a given URL, protocol and an optional observer for the open event.
   *
   * @example
   *  var socket = Rx.DOM.fromWebSocket('http://localhost:8080', 'stock-protocol', observer);
   *
   * @param {String} url The URL of the WebSocket.
   * @param {String} protocol The protocol of the WebSocket.
   * @param {Observer} [openObserver] An optional Observer to capture the open event.
   * @param {Observer} [closingObserver] An optional Observer to capture the moment before the underlying socket is closed.
   * @returns {Subject} An observable sequence wrapping a WebSocket.
   */
  dom.fromWebSocket = function (url, protocol, openObserver, closingObserver) {
    if (!root.WebSocket) { throw new TypeError('WebSocket not implemented in your runtime.'); }

    var socket;

    var observable = new AnonymousObservable(function (obs) {
      socket = protocol ? new root.WebSocket(url, protocol) : new root.WebSocket(url);

      function openHandler(e) {
        openObserver.onNext(e);
        openObserver.onCompleted();
        socket.removeEventListener('open', openHandler, false);
      }
      function messageHandler(e) { obs.onNext(e); }
      function errHandler(err) { obs.onError(err); }
      function closeHandler() { obs.onCompleted(); }

      openObserver && socket.addEventListener('open', openHandler, false);
      socket.addEventListener('message', messageHandler, false);
      socket.addEventListener('error', errHandler, false);
      socket.addEventListener('close', closeHandler, false);

      return function () {
        if(closingObserver) {
          closingObserver.onNext();
          closingObserver.onCompleted();
        }

        socket.close();

        socket.removeEventListener('message', messageHandler, false);
        socket.removeEventListener('error', errHandler, false);
        socket.removeEventListener('close', closeHandler, false);
      };
    });

    var observer = observerCreate(function (data) {
      socket.readyState === WebSocket.OPEN && socket.send(data);
    });

    return Subject.create(observer, observable);
  };
