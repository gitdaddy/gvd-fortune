#include "nodeInsert.hh"

#include "math.hh"

std::shared_ptr<Node> generateSubTree(EventPacket const& e,
                                      std::shared_ptr<Node> arcNode,
                                      std::shared_ptr<Node> optChild)
{
  auto tree = std::make_shared<Node>();
  //   var tree;
  // var nodesToClose = [];
  // var removeNode = undefined;
  // var removePoint = undefined;;
  // var nodesToClose = [];
  // var removeNode = undefined;
  // var removePoint = undefined;
  // if (eventPacket.type === PACKET_TYPE.MULTI_CHILD_PARENT) {
  //   leftArcNode = new ArcNode(eventPacket.leftChild);
  //   rightArcNode = new ArcNode(eventPacket.rightChild);
  //   var newEdge = createNewEdge(
  //       leftArcNode, rightArcNode, arcNode.site, dcel);
  //   if (optChild) {
  //     tree = splitArcNode(optChild, arcNode, dcel, nodesToClose);
  //     var parent = arcNode.parent;
  //     var childEdge =
  //         insertEdge(arcNode, newEdge, arcNode.site, dcel, nodesToClose);
  //     parent.setChild(childEdge, LEFT_CHILD);
  //   }
  //   else {
  //     tree = insertEdge(arcNode, newEdge, arcNode.site, dcel);
  //   }
  // } else if (eventPacket.type === PACKET_TYPE.PARENT) {
  //   if (optChild && optChild.isV) {
  //     // if (!optChild.isV) throw 'Invalid insert operation';
  //     var childArcNode = new ArcNode(eventPacket.child);
  //     tree = splitArcNode(optChild, arcNode, dcel, nodesToClose);
  //     var parent = arcNode.parent;
  //     var newEdge = VRegularInsert(arcNode, childArcNode, dcel, optChild);
  //     parent.setChild(newEdge, LEFT_CHILD);
  //   } else if (optChild) {
  //     tree = splitArcNode(optChild, arcNode, dcel, nodesToClose);
  //     var parent = arcNode.parent;
  //     var childArcNode = new ArcNode(eventPacket.child);
  //     var newEdge = splitArcNode(arcNode, childArcNode, dcel, nodesToClose);
  //     parent.setChild(newEdge, LEFT_CHILD);
  //   } else {
  //     // case where site is the root
  //     var childArcNode = new ArcNode(eventPacket.child);
  //     tree = splitArcNode(arcNode, childArcNode, dcel, nodesToClose);
  //   }
  // } else {
  //   if (optChild) {
  //     tree = ParaInsert(optChild, arcNode, dcel, nodesToClose);
  //   } else {
  //     tree = arcNode;
  //   }
  // }

  // return {root: tree, closingNodes: nodesToClose, optRemoveNode: removeNode, optRemovePoint: removePoint};
  // if (eventPacket.type === PACKET_TYPE.MULTI_CHILD_PARENT) {
  //   leftArcNode = new ArcNode(eventPacket.leftChild);
  //   rightArcNode = new ArcNode(eventPacket.rightChild);
  //   var newEdge = createNewEdge(
  //       leftArcNode, rightArcNode, arcNode.site, dcel);
  //   if (optChild) {
  //     tree = splitArcNode(optChild, arcNode, dcel, nodesToClose);
  //     var parent = arcNode.parent;
  //     var childEdge =
  //         insertEdge(arcNode, newEdge, arcNode.site, dcel, nodesToClose);
  //     parent.setChild(childEdge, LEFT_CHILD);
  //   }
  //   else {
  //     tree = insertEdge(arcNode, newEdge, arcNode.site, dcel);
  //   }
  // } else if (eventPacket.type === PACKET_TYPE.PARENT) {
  //   if (optChild && optChild.isV) {
  //     // if (!optChild.isV) throw 'Invalid insert operation';
  //     var childArcNode = new ArcNode(eventPacket.child);
  //     tree = splitArcNode(optChild, arcNode, dcel, nodesToClose);
  //     var parent = arcNode.parent;
  //     var newEdge = VRegularInsert(arcNode, childArcNode, dcel, optChild);
  //     parent.setChild(newEdge, LEFT_CHILD);
  //   } else if (optChild) {
  //     tree = splitArcNode(optChild, arcNode, dcel, nodesToClose);
  //     var parent = arcNode.parent;
  //     var childArcNode = new ArcNode(eventPacket.child);
  //     var newEdge = splitArcNode(arcNode, childArcNode, dcel, nodesToClose);
  //     parent.setChild(newEdge, LEFT_CHILD);
  //   } else {
  //     // case where site is the root
  //     var childArcNode = new ArcNode(eventPacket.child);
  //     tree = splitArcNode(arcNode, childArcNode, dcel, nodesToClose);
  //   }
  // } else {
  //   if (optChild) {
  //     tree = ParaInsert(optChild, arcNode, dcel, nodesToClose);
  //   } else {
  //     tree = arcNode;
  //   }
  // }

  // return {root: tree, closingNodes: nodesToClose, optRemoveNode: removeNode, optRemovePoint: removePoint};
  return nullptr;
}

