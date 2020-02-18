#include "nodeInsert.hh"

#include "math.hh"

namespace
{
  bool isLeftHull(Event const& sLower, Event const& sUpper)
  {
    // DEBUG ONLY - TODO remove for release
    if (sLower.type != EventType_e::SEG || sUpper.type != EventType_e::SEG)
      throw std::runtime_error("Invalid hull compare");
    auto a = sUpper.a;
    auto o = sLower.a;
    auto b = sLower.b;
    auto v0 = vec2(a.x - o.x, a.y - o.y);
    auto v1 = vec2(b.x - o.x, b.y - o.y);
    return math::crossProduct(v0, v1) < 0;
  }

  std::shared_ptr<bool> isClosing(std::shared_ptr<Node> child, Event const& p)
  {
    // if (p.type != EventType_e::POINT) throw std::runtime_error("Invalid close test");
    // auto r = child.nextArc().optSite;
    // auto c = child.optSite;
    // auto l = child.prevArc().optSite;

    // /* cases:
    // 1. l and c are segments and end at p
    // 2. c and r are segments and end at p
    // 2. l and r are segments and end at p
    // */

    // if (c.type === "segment" && r.type === "segment") {
    //   if (fastFloorEqual(r.b, p) && fastFloorEqual(c.b, p)) return std::make_shared<bool>(true);
    // }

    // if (l.type === "segment" && c.type === "segment") {
    //   if (fastFloorEqual(l.b, p) && fastFloorEqual(c.b, p)) return std::make_shared<bool>(true);
    // }
    return nullptr;
  }
}

SubTreeRslt generateSubTree(EventPacket const& e,
                                      std::shared_ptr<Node> arcNode,
                                      std::shared_ptr<Node> optChild)
{
  auto tree = std::make_shared<Node>(ArcType_e::UNDEFINED);
  std::vector<std::shared_ptr<Node>> nodesToClose;

  // if (e.children.size() == 2)
  // {
  //   auto leftArcNode = std::make_shared<Node>(ArcType_e::ARC, e.children[0]);
  //   auto rightArcNode = std::make_shared<Node>(ArcType_e::ARC, e.children[1]);
  //   // TODO create new edge
  //   if (optChild)
  //   {

  //   }
  //   else
  //   {

  //   }
  // }
  // else if (e.children.size() == 1)
  // {

  // }
  // else
  // {

  // }

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

  // return {root: tree, closingNodes: nodesToClose};

 return {tree, nodesToClose};
}
